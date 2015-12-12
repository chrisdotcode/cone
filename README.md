configManager
=============
configManager is a Node.js library that makes it easy to deal with config files
and directories in a platform-agnostic way.

Instead of fiddling with which OSes use which directory for config placement and how they're stored, configManager does that for you, and
presents a unified, cross-platform API for getting and setting your app's information.

`$CONFIGDIR`
============
For the sake of brevity in examples, the variable `$CONFIGDIR` will henceforth refer to the following, depending on the platform:

Platform | `$CONFIGDIR`                                     |
---------|--------------------------------------------------|
Windows  | C:\Users\chrisdotcode\AppData\Roaming\           |
Mac      | /Users/chrisdotcode/Library/Application Support/ |
Linux    | /home/chrisdotcode/.config/                      |
Other    | /home/chrisdotcode/.config/                      |

Usage
=====
```javascript
'use strict';

var configManager = require('config-manager');

var myPlatformDir = configManager.getDirFor('myApp'); // Returns "$CONFIGDIR".

var win32Dir = configManger.getDirFor('myApp', 'win32'); // === 'C:\Users\chrisdotcode\AppData\Roaming\myApp'
var darwinDir = configManager.getDirFor('myApp', 'darwin'); // === '/Users/chrisdotcode/Library/Application Support/myApp'
var linuxDir = configManager.getDirFor('myApp', 'linux'); // === '/home/chrisdotcode/.config/myApp'
// Other platforms default to "$HOME/.config"
var otherDir = configManager.getDirFor('myApp', 'sunos'); // === '/home/chrisdotcode/.config/myApp'
var nonExistentPlatform = configManager.getDirFor('myApp', 'chrisdotcodeOS') // === 'home/chrisdotcode/.config/myApp'
```

Creating a Configuration Directory
----------------------------------
```javascript
'use strict';

var configManager = require('config-manager');
// Creates a platform-specific configuration directory for 'myApp' in "$CONFIGDIR/myApp".
configManager.create('myApp');
```

Saving Files to a Configuration Directory
-----------------------------------------
```javascript
'use strict';

var configManager = require('config-manager');

// If no file name is given, and your content is JSON, configManager automatically saves a file for you in 'config.json':
configManager.save('myApp', {foo: 'bar', yes: true, no: [1, 2, 3]}); // Saves object contents to "$CONFIGDIR/myApp/config.json".

// configManager auto-detects file extensions for .yaml, .ini, .json and .bin files files:
configManager.save('myApp', {my: 'yaml', date: Date.now()}, 'config.yml'); // Saves object as YAML to "$CONFIGDIR/myApp/config.yml".
configManager.save('myApp', {my: 'ini', biz: 'baz', list: ['biz']}, 'settings.ini'); // Saves object as INI to "$CONFIGDIR/myApp/config.ini".
configManager.save('myApp', {contents: 'fileString', info: 'firstName', age: 33}, 'user.json'); // Saves object as JSON to "$CONFIGDIR/myApp/user.json".
configManager.save('myApp', new Buffer("Hello, Binary!"), 'config.bin'); // Saves Buffer as raw binary to "$CONFIGDIR/myApp/config.bin".


// If you'd like to overwrite this behavior, pass in a custom parser as the fourth argument:
configManager.save('myApp', {schema: bool, date: Date.now()}, 'foo.json', function customParser(config) {
	return "The date for this schema is:" + fileContents.date;
});

// You can also pass in a custom parser, regardless of extension:
configManager.save('myApp', {feed: '/feed.xml', blog: 'https://code.sc'}, 'feedLocation', function customParser(config) {
    return {blogFeed: config.blog + config.feed};
});


// All of the built-in parsers are exposed so that you don't have to depend on them explicitly in your package if you want to use them:
configManager.parsers.PRETTY_JSON.stringify // The default JSON stringifier. Uses JSON.stringify and pretty-prints with two spaces. 
configManager.parsers.YAML.stringify // The default YAML stringifier. Uses the 'js-yaml' package.
configManager.parsers.YML.stringify // An alias for the YAML stringifer.
configManager.parsers.INI.stringify // The default INI stringifier. Uses the 'ini' package.

// Other included stringifiers:
configManager.parsers.JSON.stringify // Node's builtin JSON object. Uses JSON.stringify.
configManager.save('myApp', 'A\nlist\nof\items', 'config', exports.parsers.LINES.stringify); // Takes an array, and writes each element line by line to the file.
configManager.save('myApp', 'This text will be written to the file unmodified', 'config.txt', exports.parsers.ID.stringify); // Takes any value and returns it as is. Writes an undefined value when the value is not a string.

// Using a builtin stringifier with custom options:
configManager.save('myApp', {foo: 'bar', private: true}, 'config.json', function(config) {
	return exports.parsers.JSON.stringify(config, null, '\t');
});
```

Loading Files
-------------
```javascript
'use strict';

var configManager = require('config-manager');

// Gets file at "$CONFIGDIR/myApp/config.json", and parses it's contents as json:
var configJSON = configManager.get('myApp');

// configManager auto-detects file extensions for .yaml, .ini, .json and .bin files files:
var ymlContents = configManager.get('myApp', 'config.yml'); // Gets YAML file contents, and gives you back a JavaScript Object.
var iniContents = configManager.get('myApp', 'settings.ini'); // Gets INI file contents, and gives you back a JavaScript Object.
var jsonContents = configManager.get('myApp', 'user.json'); // Gets JSON contents, and gives you back a JavaScript Object.
var binContents = configManager.get('myApp', 'data.bin'); // Gets binary contents, and gives you back a JavaScript Buffer.

// If you'd like to overwrite this behavior, pass in a custom parser:
var myContent = configManager.get('myApp', 'config.json', function(fileContents) {
	return fileString.substring(0, 15);
});

// All of the built-in parsers are exposed so that you don't have to depend on them explicitly in your package if you want to use them:
configManager.parsers.PRETTY_JSON.parse // The default JSON parser. Uses JSON.parse, and indents with two spaces.
configManager.parsers.YAML.parser // The default YAML parser. Uses the 'js-yaml' package.
configManager.parsers.YML.parser // An alias for the YAML parser.
configManager.parsers.INI.parser // The default INI parser. Uses the 'ini' package.

// Other included parsers:
var myContent1 = configManager.parsers.JSON.stringify // Node's builtin JSON object. Uses JSON.parse.
var myContent2 = configManager.get('myApp', 'config', exports.parsers.LINES.stringify); // Returns an array of the file contents, line by line.
var myContent3 = configManager.get('myApp', 'config.txt', exports.parsers.ID.stringify); // Returns the file contents as a string.
```

### Loading Files with Defaults
```javascript
// If the file doesn't exist, and you provide an object as the last parameter, that object will be written to the file. The object will be auto-converted to an appropriate format if the file extension ends in '.yaml', '.ini', '.json', or '.bin'.

var defaultConfig = configManager.get('myApp', {foo: 'bar'}); // If "$CONFIGDIR/config.json" does not exist, it will be written with the passed in object, and that object contents will be returned. Otherwise, the contents of "$CONFIGDIR/config.json" is returned.

var defaultYML = configManager.get('myApp', 'foobar.yml', {foo: 'bar'}); // If "$CONFIGDIR/foobar.yml" does not exist, it will be written with the passed in object converted to YAML, and the initial object will be returned. If "$CONFIGDIR/foobar.yml" does exist, the file contents will be converted to a JavaScript object from the YAML.
```

If both a custom parser and a default object are passed, if the file is not found, the default object is returned, otherwise, the file contents is parsed with the given parser and returned.

Listing Files in a Configuration Directory
------------------------------------------
```javascript
'use strict';

var configManager = require('config-manager');

configManager.list('myApp'); // Returns a list of file names in "$CONFIGDIR/myApp".
```

Delete Files in a Configuration Directory
-----------------------------------------
```javascript
'use strict';

var configManager = require('config-manager');

configManager.delete('myApp', 'foobar.BAK'); // Deletes "$CONFIGDIR/myApp/foobar.BAK".
configManager.delete('myApp'); // Deletes the entire contents of "$CONFIGDIR/myApp", recursively.
```

**N.B.**: `configManager.delete('myApp')` does not only delete a 'config.json', but the entire configuration directory. If you would like to delete *just* the 'config.json', use `configManager.delete(appName, 'config.json')`.

Install
=======
    npm install config-manager

API
===
require('config-manager')
-------------------------
Return the configManager object.

configManager.readEncoding = 'utf8'
-----------------------------------
In case you need to change the default encoding for files loaded with [configManager.get](#configManager-get). This default should be adequate for most use cases.

configManager.writeEncoding = 'utf8'
-----------------------------------
In case you need to change the default encoding for files saved with [configManager.save](#configManager-save). This default should be adequate for most use cases.


configManager.getDirFor(appName [, platform])
---------------------------------------------
Returns the platform-specific configuration directory for the given `appName`. If `platform` is passed as well, this function returns the platform-specific configuration directory for the given `appName` on `platform`. The three recognized platform strings are `win32`, `darwin`, or `linux`. Any other platform will make this function return: "$HOME/.config".

Example:
```javascript
'use strict';

var configManager = require('configManager');

var dir = configManager.getDirFor('myApp');
// On Windows === 'C:\Users\chrisdotcode\AppData\Roaming\myApp'.
// On Mac === '/Users/chrisdotcode/Library/Application Support/myApp'.
// On Linux === '/home/chrisdotcode/.config/myApp'.

// With `platform`:
var dirForLinux = configManager.getDirFor('myApp', 'linux'); // === '/home/chrisdotcode/.config/myApp'.
```

configManager.getFileFor(appName, file [, platform])
----------------------------------------------------
Returns the platform-specific location of `file` in the configuration directory for the given `appName`. If `platform` is passed as well, this function returns the platform-specific location of `file` in the configuration directory for the given `appName` on `platform`. The three recognized platform strings are `win32`, `darwin`, or `linux`. Any other platform will make this function return: "$HOME/.config/$file".

Example:
```javascript
'use strict';

var configManager = require('configManager');

var dir = configManager.getFileFor('myApp', 'config.json');
// On Windows === 'C:\Users\chrisdotcode\AppData\Roaming\myApp\config.json'.
// On Mac === '/Users/chrisdotcode/Library/Application Support/myApp/config.json'.
// On Linux === '/home/chrisdotcode/.config/myApp/config.json'.

// With `platform`:
var dirForLinux = configManager.getFileFor('myApp', 'linux'); // === '/home/chrisdotcode/.config/myApp/config.json'.
```

configManager.create(appName)
-----------------------------
Creates a platform-specific configuration directory for 'myApp' in "$CONFIGDIR/myApp". If "$CONFIGDIR" already exists, nothing happens.

Example:
```javascript
'use strict';

var configManager = require('config-manager');
configManager.create('myApp'); // Creates "$CONFIGDIR/myApp".
```

configManager.get(appName [, fileName:string | defaultContents:object])
-----------------------------------------------------------------------
Returns the 'config.json' for the given configuration directory located at "$CONFIGHOME/appName" with `configManager.readEncoding`.

- If a string argument `fileName` is passed, "$CONFIGHOME/appName/$fileName" is
  loaded and returned instead of 'config.json'. If that location
  could not be found, null is returned. If `fileName` has a file extension of
  '.json', '.yml', '.ini', or '.bin', an object is returned, based on a parsed
  version of that file type. If you do not
  want this behavior, please use
  [configManager.get(appName, fileName, parser)]().
- If an object argument `defaultContents` is passed,
  "$CONFIGHOME/appName/config.json" is attempted to be loaded, and if it is not
  found, it is written with the contents of `defaultContents` as stringified
  JSON, and that value is returned.

configManager.get(appName, fileName [, parser:function | defaultContents:object])
-----------------------------------------------------------------------------
Returns the $fileName for the given configuration directory located at
"$CONFIGHOME/appName/$fileName" with readEncoding.

- If that location could not be loaded, null is returned. If
  `fileName` has a file extension of '.json', '.yml', '.ini', or '.bin', an
  object is returned, based on a parsed version of that file type. If you do not want this behavior, please use
  [configManager.get(appName, fileName, parser)]().
- If a function argument `customParser` is passed, the string contents (read
  with readEncoding) are passed directly to this function to be parsed and
  returned.
- If an object argument `defaultContents` is passed,
  "$CONFIGHOME/appName/config.json" is attempted to be loaded, and if it is not
  found, it is written with the contents of `defaultContents` as stringified
  JSON, and that value is returned.

configManager.get(appName, fileName, parser [, defaultContents:object])
-----------------------------------------------------------------------
Returns the $fileName for the given configuration directory located at
"$CONFIGHOME/appName/$fileName", with the string contents being parsed by
`customParser`, with readEncoding.

- If that location could not be loaded, null is returned.
- If an object argument `defaultContents` is passed,
  "$CONFIGHOME/appName/config.json" is attempted to be loaded, and if it is not
  found, it is written with the contents of `defaultContents` as stringified
  JSON, and that value is returned. This overwrites the returning of null above.

configManager.save(appName, file, fileContents [, stringifier])
---------------------------------------------------------------
Saves the contents of `fileContents` in "$CONFIGDIR/$appName/$fileName" with
`writeEncoding`. If the configuration directory does not exist, it is created.
If the given file exists, it it overwritten. If `fileName` has a file
extension of '.json', '.yml', '.ini', or '.bin', an object is returned, based on
a parsed version of that file type.

- If a function argument `stringifier` is passed, the string contents are passed
  directly to this function to be parsed and written (with writeEncoding).

configManager.list(appName)
---------------------------
Returns a list of configuration files in "$CONFIGDIR/appName". If the directory
does not exist, null is returned. If the configuration directory exists, but
contains no configuration files, an empty array is returned.

configManager.delete(appName [, filename])
------------------------------------------
Deletes the configuration directory, and all configuration files located at
"$CONFIGDIR/appName/\*". If the directory does not exist, nothing happens.

**N.B.**: `configManager.delete('myApp')` does not only delete a 'config.json', but the entire configuration directory. If you would like to delete *just* the 'config.json', use `configManager.delete(appName, 'config.json')`.

- If a `fileName` string argument is passed in, only that file
  "$CONFIGDIR/appname/$fileName" is deleted.

configManager.parsers
---------------------
An object of parsers that can be used for both parsing and stringifying configs and files. configManager makes use of these internally to performed aforementioned actions. They are exposed so that you don't have to depend on them explicitly in your package if you want to use them.

### configManager.parsers.PRETTY_JSON

#### configManager.parsers.PRETTY_JSON.raw
The parser and stringifer object used for both reading and writing '.json' files.

#### configManager.parsers.PRETTY_JSON.parser
The default JSON parser. Uses <code>[JSON.parse(config, null, 2)]()</code> to read the file contents.

#### configManager.parsers.PRETTY_JSON.stringify
The default JSON stringifier. Uses <code>[JSON.stringify]()</code> to pretty-print a JSON file with two space indentation.

### configManager.parsers.YAML

#### configManager.parsers.YAML.parser.raw
The parser and stringifer object used for both reading and writing '.y[a]ml'
files. This uses the [xyz]() library.

#### configManager.parsers.YAML.parse
The default YAML parser. Uses [js-yaml's .load]() to read the file contents.

#### configManager.parsers.YAML.stringify
The default YAML stringifer. Uses [js-yaml .dump]() to write the file contents.

### configManager.parsers.YML
An alias to the [YAML parser]().

#### configManager.parsers.YML.parser.raw
An alias to the raw, builtin [YAML parser]() object.

#### configManager.parsers.YML.parse
An alias to the builtin YAML parser.

#### configManager.parsers.YML.stringify
An alias to the builtin YAML stringifier.

### configManager.parsers.INI

#### configManager.parsers.INI.raw
The parser and stringifer object used for both reading and writing '.ini' files.
This is done with the [ini](library).

#### configManager.parsers.INI.parse
The default INI parser. Uses [ini.parse]() to read the file contents.

#### configManager.parsers.INI.stringify
The default INI stringifer. Uses <code>[ini.stringify]()</code> to write the file contents.

### configManager.parsers.BIN

#### configManager.parsers.BIN.raw
The parser and stringifer object used for both reading and writing '.bin' files.
Uses [node.js](Buffer).

#### configManager.parsers.BIN.parse
The default .BIN parser. Uses [buffer stuff]() to read the file contents.

#### configManager.parsers.BIN.stringify
The default binary stringifer. Uses <code>[buffer stuff]()</code> to write the file contents.

### configManager.parsers.ID

#### configManager.parsers.ID.raw
The parser and stringifer object used for both reading and writing string files
verbatim.

#### configManager.parsers.ID.parse
The default string parser. Returns the file contents as a readEncoding string
verbatim.

#### configManager.parsers.ID.stringify
The default string stringifier. Writes the file contents as a writeEncoding string
verbatim.

### configManager.parsers.LINES

#### configManager.parsers.LINES.raw
The parser and stringifer object used for both reading and writing string files
into arrays, separated (or joined) line by line.

#### configManager.parsers.LINES.parse
Returns the file contents as a readEncoding string verbatim, separated line by
line by a newline.

#### configManager.parsers.LINES.stringify
Writes (and returns) the file contents as a writeEncoding string verbatim,
joined line by line by a newline.

### configManager.parsers.JSON

#### configManager.parsers.JSON.raw
A parser and stringifer object that can be used for both reading and writing '.json' files.

#### configManager.parsers.JSON.parser
Exposes <code>[JSON.parse()]()</code> to read the file contents, based on user-given parameters.

#### configManager.parsers.JSON.stringify
Exposes <code>[JSON.parse()]()</code> to write (and return) the file contents,
based on user-given parameters in writeEncoding.
