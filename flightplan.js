// flightplan.js
var plan = require('flightplan');
var os = require('os');

// configuration
plan.target('staging', {
	host: 'ury',
	username: 'deploy',
	agent: process.env.SSH_AUTH_SOCK,
	privateKey: os.homedir() + '/.ssh/id_rsa_deploy'
},
{
	install_dir: '/usr/local/www/node-timelord-staging'
});

var tmpDir = 'node-timelord-' + new Date().getTime();

// run commands on localhost
plan.local(function(local) {
	local.log('Copy files to remote hosts');
	var filesToCopy = local.find('bin/ -type f', {silent: true}).stdout.split('\n');
	// rsync files to all the target's remote hosts
	local.transfer(filesToCopy, '/tmp/' + tmpDir);
});

// run commands on the target's remote hosts
plan.remote(function(remote) {
	remote.log('Move folder to web root');
	remote.rsync('-az --force --delete -O /tmp/' + tmpDir + '/bin/ ' + plan.runtime.options.install_dir, {failsafe: true});
	remote.rm('-rf /tmp/' + tmpDir);
});
