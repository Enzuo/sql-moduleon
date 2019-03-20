'use strict';

var sql_templates_func = {};

// Declare defaults options or take provided options
// =================================================
var config = {
	engine : 'mysql',

};


/*=====================================================================

									Interface

=====================================================================*/
/**
 * @param  {Object} opts (Optional) :
 *
 * @return {Function} template function
 */
module.exports = function( sql ) {
	return generateFunction( sql );
};

module.exports.setConfig = function( opts ){
	config.engine = opts.engine || config.engine;
};


/**
 * @param  {String} sql : sql template to generate the template function from
 * @return {Function} template function
 */
function generateFunction( sql ){

	var tb = '{{';
	var te = '}}';
	var varname = 'data';
	var _code = '';

	var arr = sql.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\t]|(\/\*[\s\S]*?\*\/)/g, ' ')
		.split(tb).join(te +'\x1b')
		.split(te);

	for (var m=0, l=arr.length; m < l; m++) {
		if( arr[m].charAt(0) !== '\x1b' ){
			_code += 'out+=\'' + arr[m].replace(/(\\|["'])/g, '\\$1').replace(/\n/g, '\\n') + '\'';
		}
		else{
			if(arr[m].charAt(1) === '='){
				_code += ';vals.push(' + varname + '.' + arr[m].substr(2).replace(/\s/g, '') + ');';
				_code += _codeAddSqlParameter();
			}
			else if(arr[m].charAt(1) === '?' && arr[m].length === 2){
				_code += '}';
			}
			else if(arr[m].charAt(1) === '?'){
				_code += ';if(' ;
				_code += varname + '.' + arr[m].substr(2).replace(/\s/g, '') ;
				_code += '){';
			}
			else{
				_code += ';' + arr[m].substr(1);
			}
		}
	}

	_code = ('var vals = [], out="";'+_code+';return { sql:out, values:vals };');
		// .split('out+=\'\';').join('')
		// .split('var out="";out+=').join('var out=');

	try {
		/*jslint evil: true */
		return new Function( varname, _code);
	} catch (e) {
		if (typeof console !== 'undefined') console.log('Could not create a template function: ' + _code);
		throw e;
	}
}


/*=================================================================

						Template Generator Helper Functions

=================================================================*/
function _codeAddSqlParameter(){
	var _code = '';
	if(config.engine === 'pg'){
		_code = 'out+=( \'$\'+ vals.length );';
	}
	else{
		_code += 'out+=( \'?\' );';
	}
	return _code;
}
