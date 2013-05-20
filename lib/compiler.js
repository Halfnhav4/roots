require('coffee-script');

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    shell = require('shelljs'),
    EventEmitter = require('events').EventEmitter,
    adapters = require('./adapters'),
    compress = require('./utils/compressor'),
    output_path = require('./utils/output_path'),
    Helper = require('./utils/compile_helper'),
    _ = require('underscore'),
    file_helper = require('./utils/file_helper');

function Compiler(){ EventEmitter.call(this); }
util.inherits(Compiler, EventEmitter);
module.exports = Compiler;

Compiler.prototype.finish = function(){
  this.emit('finished');
};

Compiler.prototype.compile = function(file, cb){
  var adapters = get_adapters_by_extension(file.split('.').slice(1));
  var fh = file_helper(file);
  var self = this;

  adapters.forEach(function(adapter, i){
    var intermediate = adapters.length - i - 1 > 0 ? true : false;

    adapter.compile(fh, function(err, compiled){
      if (err) { return self.emit('error', err); }

      if (intermediate){
        return pass_through()
      } else {
        return write_file()
      }

      function pass_through(){
        fh.contents = compiled;
        cb();
      }

      function write_file(){
        if (fh.layout_path) {
          compile_into_layout(fh, adapter, compiled, function(compiled_with_layout){
            write(compiled_with_layout);
          });
        } else {
          typeof compiled === 'function' ? write(compiled(fh.locals())) : write(compiled);
        }        
      }

      function write(content){
        intermediate ? fh.contents = content : fh.write(content);
        cb();
      }

    });

  });

};

Compiler.prototype.copy = function(file, cb){
  // TODO: Run the file copy operations as async (ncp)
  var destination = output_path(file);
  var extname = path.extname(file).slice(1);
  var types = ['html', 'css', 'js'];

  if (types.indexOf(extname) > 0) {
    var write_content = fs.readFileSync(file, 'utf8');

    if (global.options.compress) {
      write_content = compress(write_content, extname);
    }

    fs.writeFileSync(destination, write_content);
  } else {
    shell.cp('-f', file, destination);
  }

  global.options.debug.log('copied ' + file);
  cb();
};

// @api private

var plugin_path = path.join(process.cwd() + '/plugins'),
    plugins = fs.existsSync(plugin_path) && shell.ls(plugin_path);

function get_adapters_by_extension(extensions){

  var matching_adapters = [];

  extensions.reverse().forEach(function(ext){

    for (var key in adapters) {
      if (adapters[key].settings.file_type == ext) {
        matching_adapters.push(adapters[key]);
      }
    }

  });

  return matching_adapters
}

function compile_into_layout(fh, adapter, compiled, cb){
  var file_mock = _.clone(fh)
  file_mock.path = fh.layout_path
  file_mock.contents = fh.layout_contents

  if (typeof compiled !== 'function') { console.log('html compilers must output a function') }

  adapter.compile(file_mock, function(err, layout){
    var page = compiled(fh.locals());
    var rendered_template = layout(fh.locals({ 'yield': page }));
    cb(rendered_template);
  });
}