var path = require('path'),
    shell = require('shelljs'),
    run = require('child_process').exec,
    colors = require('colors'),
    fresher = require('fresher'),
    current_directory = path.normalize(process.cwd());

var _new = function(commands){

  if (typeof commands[0] === "undefined") {
    return console.error('make sure to pass a name for your project!'.red);
  }

  // 
  // check for a new version
  // 

  // if the request takes more than 2.5 seconds to come back, forget it
  var update_checked = false;
  var guard = setTimeout(function(){ !update_checked && process.exit(); }, 2500)

  // check against npm
  var update = fresher('roots', path.join(__dirname, '../../package.json'), function(err, update){
    clearTimeout(guard)
    if (update){
      update_checked = true;
      console.log('a new version of roots is out'.yellow);
      console.log('update with ' + 'npm install roots -g'.bold);
      console.log('');
    }
  });

  switch (commands[1]){
    case '--basic':
      var source = path.join(__dirname, '../../templates/new_basic');
      break;
    case '--express':
      var source = path.join(__dirname, '../../templates/new_express');
      break;
    case '--ejs':
      var source = path.join(__dirname, '../../templates/new_ejs');
      break;
    case '--blog':
      var source = path.join(__dirname, '../../templates/new_blog');
      break;
    case '--min':
      var source = path.join(__dirname, '../../templates/new_min');
      break;
    // case '--backbone':
    //   var source = path.join(__dirname, '../../templates/new_backbone');
    //   break;
    default:
      var source = path.join(__dirname, '../../templates/new');
  }

  var destination = path.join(current_directory, commands[0]);

  shell.cp('-r', source + '/*', destination);
  console.log('\nnew project created at /'.green + commands[0].green + '\n');

  run("git init " + destination, function(err){
    if (err) {
      console.log("You should install git ASAP.".red);
      console.log('Check out http://git-scm.com/ for a quick and easy download\n'.yellow);
    }
  });
};

module.exports = { execute: _new };
