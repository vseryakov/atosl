#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var exec = require("child_process").exec;

var stack = 0;
var backtrace = [];
var thread = [];
var cmds = [];
var logfile = process.argv[process.argv.length - 1];
var bin = "atosl";
var app = "app";
var arch = "armv7";
var version = null;
var appfile = null;

var argv = [];
for (var i in process.argv) argv.push(process.argv[i]);
try {
   String(fs.readFileSync(process.env.HOME + "/.atoslrc")).split("\n").forEach(function(x) {
      x = x.split("=");
      if (x.length == 2) argv.push("-" + x[0], x[1]);
   });
} catch(e) {}

for (var i = 1; i < argv.length - 1; i++) {
    if (argv[i] == "-bin") bin = argv[i + 1]; 
    if (argv[i] == "-app") app = argv[i + 1]; 
    if (argv[i] == "-file") appfile = argv[i + 1]; 
    if (argv[i] == "-ver") version = argv[i + 1]; 
}

fs.readFile(logfile, function(err, data) {
    if (err) return console.log("ERROR:", err);
    
    data = String(data).split("\n");

    for (var i = 0; i < data.length; i++) {
	var line = data[i].split(/[ ]+/);
        if (line[0] == "Thread" && stack) {
	    stack = 0;
        }
	if (line[0] == "Last" && !stack) {
    	    stack = 1;
        }
        if (line[0] == "Thread" && line[2] == "Crashed:" && !stack) {
	    stack = 2;
        }

	if (stack == 1 && line[3] && line[3].match(/^0x[0-9a-z]+/)) {
	    backtrace.push([line[3], line[2]]);
	}
	if (stack == 2 && line[3] && line[3].match(/^0x[0-9a-z]+/)) {
	    thread.push([line[3], line[2]]);
	}

	if (line[4] == "armv7s") arch = "armv7s";
	if (line[0] == "Version:" && version == null) version = line[1];
        if (line[0] == "***") console.log(data[i]);
    }
    
    var dsym = appfile || (app + (version ? version : "") + "." + arch);
    fs.exists(dsym, function(yes) {
	if (!yes) return console.log("cannot find " + dsym);

    	function build(list) {
	    var addr = "", cmd = "";
	    list.forEach(function(x) {
	        if (x[0] != addr) {
		    if (cmd) cmds.push(cmd);
		    cmd = "";
		    addr = x[0];
	        }
	        if (!cmd) cmd = bin + " -o " + dsym + " -l " + x[0];
	        cmd += " " + x[1];
            });
	    if (cmd) cmds.push(cmd);
        }
        cmds.push("echo", "echo ^Backtrace:");
        build(backtrace);
        cmds.push("echo", "echo ^Thread Crashed:");
        build(thread);
    
        exec(cmds.join(";"), function (err, stdout, stderr) {
	    if (err) console.log("\n", err, "\n");
	    if (stderr) console.log("\n", stderr, "\n");
    	    if (stdout) console.log(stdout.split("\n").map(function(x) { return x[0] == "^" ? x : "\t" + x; }).join("\n"));
        });
    });
});
