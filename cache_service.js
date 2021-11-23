const NodeCache = require( "node-cache" );

const intervalsCache = new NodeCache();

module.exports = intervalsCache;