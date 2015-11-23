'use strict';

var fs   = require('fs');
var os   = require('os');
var path = require('path');

var ini    = require('ini');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var yaml   = require('js-yaml');

function isPlainObject(value) {
	return Object.prototype.toString.call(value) === '[object Object]';
};

exports = module.exports = {};

exports.readEncoding  = 'utf8';
exports.writeEncoding = 'utf8';

exports.getDirFor = function getDirFor(appName, platform) {
	switch (platform || process.platform) {
	case 'win32':
		if (process.env.APPDATA) {
			return path.join(process.env.APPDATA, appName);
		} else {
			return path.join(os.homedir(), 'AppData', 'Roaming', appName);
		}
		break;
	case 'darwin':
		return path.join(os.homedir(), 'Library', 'Application Support', appName);
		break;
	default: // 'freebsd', 'linux', 'sunos' or other.
		if (process.env.XDG_CONFIG_HOME) {
			return path.join(process.env.XDG_CONFIG_HOME, appName);
		/* } else if (process.env.XDG_CONFIG_DIRS) {
			// Only use the first path in the list of dirs.
			return path.join(process.env.XDG_CONFIG_DIRS.split(':')[0], appName);
			$XDG_CONFIG_DIR's default is '/etc/xdg'
		} */
		} else {
			return path.join(os.homedir(), '.config', appName);
		}
		break;
	}
};

exports.getFileFor = function getFileFor(appName, file, platform) {
	return path.join(exports.getDirFor(appName, platform), file);
};

exports.create = function create(appName) {
	return mkdirp.sync(exports.getDirFor(appName));
};

exports.parsers = {};

exports.parsers.PRETTY_JSON = {
	parse: JSON.parse,
	stringify: function stringify(config) {
		return JSON.stringify(config, null, 2);
	},
	raw: exports.parsers.PRETTY_JSON
};

exports.parsers.YAML = {
	parse: yaml.load,
	stringify: yaml.dump,
	raw: yaml
};

exports.parsers.YML = exports.parsers.YAML;

exports.parsers.INI = {
	parse: ini.parse,
	stringify: ini.stringify,
	raw: ini
};

exports.parsers.BIN = {
	parse: function parse(fileContents) {
		// This is necessary because we read the fileContents as a utf8
		// encoded string defaultly - so we must convert that string into
		// binary.
		return new Buffer(fileContents);
	},
	stringify: function stringify(config) {
		return new Buffer(config);
	},
	raw: exports.parsers.BIN,
};

exports.parsers.ID = {
	parse: function parse(fileContents) {
		return fileContents;
	},
	stringify: function stringify(string) {
		return string;
	},
	raw: exports.parsers.ID,
};

exports.parsers.LINES = {
	parse: function parse(fileContents) {
		return fileContents.split('\n');
	},
	stringify: function stringify(lines) {
		return lines.join('\n');
	},
	raw: exports.parsers.LINES,
};

exports.parsers.JSON = {
	parse: JSON.parse,
	stringify: JSON.stringify,
	raw: JSON
};

exports.get = function get(appName, file, parser, defaultContents) {
	var configDir = exports.getDirFor(appName);

	if (arguments.length === 3) {
		if (isPlainObject(parser)) {
			defaultContents = parser;
			parser          = null;
		}
	} else if (arguments.length === 2) {
		if (isPlainObject(file)) {
			defaultContents = file;
			file            = 'config.json';
		}
	} else if (arguments.length === 1) {
		file = 'config.json';
	}

	try {
		var fileContents = fs.readFileSync(exports.getFileFor(appName, file), {encoding: exports.readEncoding});
	} catch (e) {
		if (e.code === 'ENOENT' && defaultContents) {
			return exports.save(appName, file, defaultContents);
		} else {
			return null;
		}
	}

	if (parser) {
		return parser(fileContents);
	} else if (file.endsWith('.json')) {
		return exports.parsers.PRETTY_JSON.parse(fileContents);
	} else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
		return exports.parsers.YAML.parse(fileContents);
	} else if (file.endsWith('.ini')) {
		return exports.parsers.INI.parse(fileContents);
	} else if (file.endsWith('.bin')) {
		return exports.parsers.BIN.parse(fileContents);
	} else {
		return exports.parsers.ID.parse(fileContents);
	}
};

exports.save = function save(appName, file, fileContents, stringifier) {
	var configDir = exports.getDirFor(appName);

	// Create `configDir` if it doesn't already exist.
	exports.create(configDir);

	function saveWith(stringifier) {
		var contents = stringifier(fileContents);

		fs.writeFileSync(exports.getFileFor(appName, file), contents, {encoding: exports.writeEncoding});

		return contents;
	}

	if (isPlainObject(file)) {
		fileContents = file;
		file         = 'config.json';

		return saveWith(exports.parsers.PRETTY_JSON.stringify);
	} else {
		if (stringifier) {
			return saveWith(stringifier);
		} else if (file.endsWith('.json') || isPlainObject(fileContents)) {
			return saveWith(exports.parsers.PRETTY_JSON.stringify);
		} else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
			return saveWith(exports.parsers.YAML.stringify);
		} else if (file.endsWith('.ini')) {
			return saveWith(exports.parsers.INI.stringify);
		} else if (file.endsWith('.bin')) {
			return saveWith(exports.parser.BIN.stringify);
		} else {
			return saveWith(exports.parsers.ID.stringify);
		}
	}
};

exports.list = function list(appName) {
	var configDir = exports.getDirFor(appName);

	try {
		return fs.readdirSync(configDir);
	} catch (e) {
		return null;
	}
};

exports.delete = function delete_(appName, file) {
	rimraf.sync(exports.getFileFor(appName, file || ''));
};
