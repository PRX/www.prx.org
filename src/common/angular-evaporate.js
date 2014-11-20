angular.module('angular-evaporate', ['async-loader'])
.provider('evaporate', function () {

  var injector;

  var config = {
    signerUrl: null,
    bucket: null,
    awsKey: null,
    awsUrl: 'https://s3.amazonaws.com',
    cloudfront: false,
    options: {}
  };

  var Provider = {
    signerUrl: function (signerUrl) {
      config.signerUrl = signerUrl;
      return Provider;
    },
    awsKey: function (awsKey) {
      config.awsKey = awsKey;
      return Provider;
    },
    awsUrl: function (awsUrl) {
      config.awsUrl = awsUrl;
      return Provider;
    },
    bucket: function (bucket) {
      config.bucket = bucket;
      return Provider;
    },
    cloudfront: function (cloudfront) {
      config.cloudfront = cloudfront;
      return Provider;
    },
    options: function (options) {
      config.options = options;
      return Provider;
    },
    '$get': ['$q', '$window', '$rootScope', 'AsyncLoader',
      function ($q, $window, $rootScope, AsyncLoader) {
        return new NgEvaporate($q, $window, $rootScope, config, AsyncLoader);
    }]
  };

  function NgEvaporate ($q, $window, $rootScope, config, AsyncLoader) {
    var e = this;
    e.q         = $q;
    e.rootScope = $rootScope;
    e.window    = $window;
    e.options   = config;
    e.loader    = AsyncLoader;

    e.opts = angular.copy(e.options.options);
    e.opts.signerUrl  = e.options['signerUrl'];
    e.opts.bucket     = e.options['bucket'];
    e.opts.cloudfront = e.options['cloudfront'];

    // rename awsKey -> aws_key
    e.opts.aws_key    = e.options['awsKey'];
    e.opts.aws_url    = e.options['awsUrl'];
  }

  NgEvaporate.prototype = {
    loadEvaporate: function() {
      var e = this;
      return e.loader.load('/vendor/EvaporateJS/evaporate.js').then( function(loaded) {
        e._evaporate = new e.window.Evaporate(e.opts);
      });
    },
    add: function(config) {
      var e = this;

      var deferred = e.q.defer();

      config.complete = function () {
        e.rootScope.$evalAsync( function() {
          deferred.resolve();
        });
      };

      config.error = function(msg) {
        e.rootScope.$evalAsync( function() {
          deferred.reject(msg);
        });
      };

      config.progress = function(p) {
        e.rootScope.$evalAsync( function() {
          deferred.notify(p);
        });
      };

      // add the upload info to the underlying evaporate obj
      // save the returned `id` on the promise itself
      var promise = deferred.promise;

      // return promise;
      return e.loadEvaporate().then( function () {
        promise.uploadId = e._evaporate.add(config);
        return promise;
      });
    }
  };

  return Provider;

});
