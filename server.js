//----------------------------------------------------------------------------------------------------------------------
// Main server module for Tome Wiki.
//
// @module server.js
//----------------------------------------------------------------------------------------------------------------------

var logging = require('omega-logger');

if(process.env.LOG_LEVEL)
{
    logging.defaultConsoleHandler.level = logging.getLevel(process.env.LOG_LEVEL);
} // end if

var logger = logging.getLogger('server');

//----------------------------------------------------------------------------------------------------------------------

var Promise = require('bluebird');

var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

var _ = require('lodash');
var connect = require('connect');
var redirect = require('connect-redirection');
var restify = require('restify');

var routes = require('./server/routes');
var auth = require('./server/authentication');

var package = require('./package');
var config = require('./server/config');

// Use 'restify-async-json-body-parser' if available.
var bodyParser;
try
{
    bodyParser = require('restify-async-json-body-parser');
}
catch(exc)
{
    bodyParser = restify.bodyParser;
} // end try

//----------------------------------------------------------------------------------------------------------------------

var app = restify.createServer(
    {
        name: 'Tome Wiki',
        version: package.version,
        log: logger,
        formatters: {
            'text/html': function(req, res, body)
            {
                if(body instanceof Error)
                {
                    return body.stack;
                } // end if

                return body;
            }
        }
    })
    .use(bodyParser())
    .use(restify.queryParser())

    .use(connect.cookieParser(config.secret))
    .use(connect.session({
        secret: config.secret || 'nosecret',
        key: config.sid || 'sid',
        store: new connect.session.MemoryStore()
    }))

    .use(restify.gzipResponse())
    .use(redirect())

    .on('after', function(request, response, route, error)
    {
        if(error)
        {
            logger.warn('%s %s -> %s: %s',
                request.method, logger.dump(request.url),
                logger.dump(response.statusCode), error.stack || error.toString());
        }
        else
        {
            logger.debug('%s %s -> %s: (body not shown)',
                request.method, logger.dump(request.url),
                logger.dump(response.statusCode));

            if(response._body instanceof Error)
            {
                logger.warn('Error stack: %s', response._body.stack || response._body.toString());
            } // end if
        } // end if
    }) // end 'after' handler

    .use(function(request, response, next)
    {
        response.respond = function(statusCode, data, callback)
        {
            switch(arguments.length)
            {
                case 2:
                    if(!_.isFunction(data)) { break; }
                    callback = data;
                    /* falls through */
                case 1:
                    data = statusCode;
                    statusCode = 200;
            } // end if

            logger.debug('%s %s: Responding with %s: %s',
                request.method, logger.dump(request.url),
                logger.dump(statusCode), logger.dump(data));

            response.send(statusCode, data);

            if(callback) { callback(); }
        }; // end response.respond

        response.respondAsync = Promise.promisify(response.respond);

        next();
    })
;

routes(app);
auth(app);

var staticHandlers = [];

function serveStatic(options)
{
    staticHandlers.push(
        Promise.promisify(restify.serveStatic(options))
    );
} // end serveStatic

serveStatic({directory: path.join(__dirname, 'client')});

app.get(/.*/, function(request, response, next)
{
    var remainingHandlers = staticHandlers.slice();

    function nextStaticOrDefault()
    {
        var handler = remainingHandlers.pop();
        if(handler)
        {
            return handler(request, response)
            .catch(restify.ResourceNotFoundError, nextStaticOrDefault);
        }
        else
        {
            /*
            var fileStream = fs.createReadStream(path.join(__dirname, 'client', 'index.html'));

            response.writeHead(200, { 'Content-Type': 'text/html' });
            fileStream.pipe(response);

            */

            response.contentType = 'text/html';
            var body = fs.readFileSync(path.join(__dirname, 'client', 'index.html'), {encoding: 'utf-8'});
            return response.respondAsync(body);
        } // end if
    } // end nextStaticOrDefault

    nextStaticOrDefault()
    .then(function() { next(false); }, next);
});

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    app: app,
    listen: function()
    {
        var server = app.listen(config.port || 4000);

        logger.info('%s v%s started on %s, port %s.',
            app.name, package.version, server.address().address, server.address().port);
    }, // end listen
    serveStatic: serveStatic
}; // end exports

//----------------------------------------------------------------------------------------------------------------------
