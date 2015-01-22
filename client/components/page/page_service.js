// ---------------------------------------------------------------------------------------------------------------------
// PageService
//
// @module page_service.js
// ---------------------------------------------------------------------------------------------------------------------

function PageServiceFactory($q, $route, $cacheFactory, $http, PageResource)
{
    function PageService()
    {
        this.pageCache = $cacheFactory('existsCache', { capacity: 500 });

        Object.defineProperties(this, {
            wikiPath: {
                get: function(){ return $route.current.params.wikiPath; }
            },
            current: {
                get: function(){ return this.get(); }
            }
        });
    } // end PageService

    PageService.prototype.get = function(wikiPath, revision)
    {
        wikiPath = wikiPath || this.wikiPath;
        var key = revision ? wikiPath + '@' + revision : wikiPath;

        // Attempt to get a cached page object
        var page = this.pageCache.get(key);

        if(!page)
        {
            page = PageResource(wikiPath, revision);
            this.pageCache.put(key, page);
        }
        else
        {
            // Get the latest version of the page
            page.refresh();
        } // end if

        return page;
    }; // end get

    PageService.prototype.exists = function(url)
    {
        var deferred = $q.defer();

        $http.head(url)
            .success(function() { deferred.resolve(true); })
            .error(function() { deferred.resolve(false); });

        return deferred.promise;
    }; // end exists

    return new PageService();
} // end PageServiceFactory

// ---------------------------------------------------------------------------------------------------------------------

angular.module('tome.services').service('PageService', [
    '$q',
    '$route',
    '$cacheFactory',
    '$http',
    'PageResource',
    PageServiceFactory
]);

// ---------------------------------------------------------------------------------------------------------------------