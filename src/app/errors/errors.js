angular.module('prx.errors', ['ui.router'])
.config(function ($urlRouterProvider) {
  $urlRouterProvider.otherwise(function ($injector, $location) {
    $injector.get('prxError').routerError($location.url());
  });
})
.run(function ($rootScope, prxError) {
  $rootScope.$on('$stateChangeError', function (event, toState, stateParams, fromState, fromParams, error) {
    prxError.stateChangeError(toState, stateParams, fromState, fromParams, error);
  });
  $rootScope.$on('$stateChangeStart', prxError.dismiss);
})
.directive('prxErrorModal', function () {
  return {
    restrict: 'E',
    templateUrl: 'errors/error_modal.html',
    controller: 'ErrorCtrl',
    replace: true,
    controllerAs: 'error'
  };
})
.service('prxError', function ($state) {
  var lastError, self = this;


  function GeneralError (headline, message) {
    if(headline) {
      this.headline = headline;
    }
    if (message) {
      this.message = message;
    }
  }

  GeneralError.prototype.canRetry = false;
  GeneralError.prototype.canGoBack = false;
  GeneralError.prototype.headline = "Something went wrong.";
  GeneralError.prototype.message =
    "Sorry about this, but we had some trouble " +
    "putting the page you asked for together.";
  GeneralError.prototype.debuggable = true;

  function StateChangeError (state, params, fromState, fromParams, error) {
    if (!fromState.abstract) {
      this.canGoBack = true;
    }

    this.state = state;
    this.params = params;
    this.fromState = fromState;
    this.fromParams = fromParams;
    this.error = error;
    if (error.status == 404) {
      this.canRetry = false;
      this.debuggable = false;
      this.headline = "Something is missing...";
      this.message = "The page you asked for was not found.";
    }
  }

  StateChangeError.prototype = Object.create(GeneralError.prototype);
  StateChangeError.prototype.constructor = StateChangeError;
  StateChangeError.prototype.canRetry = true;
  StateChangeError.prototype.goBack = function () {
    $state.go(this.fromState, this.fromParams);
  };
  StateChangeError.prototype.retry = function () {
    $state.go(this.state, this.params);
  };

  this.generalError = function (heading, message) {
    return lastError = new GeneralError(heading, message);
  };

  this.stateChangeError = function (toState, stateParams, fromState, fromParams, error) {
    return lastError = new StateChangeError(toState, stateParams, fromState, fromParams, error);
  };

  this.routerError = function (url) {
    lastError = new GeneralError("Something is missing...",
      "I couldn't find a page that lives at the URL you requested. " +
      "Make sure you typed it correctly, or let us know if you're pretty sure " +
      "this one should work.");
    lastError.url = url;
    return lastError;
  };

  this.hasError = function () {
    return !!lastError;
  };

  this.canRetry = function () {
    return lastError && lastError.canRetry;
  };

  this.canGoBack = function () {
    return lastError && lastError.canGoBack;
  };

  this.message = function () {
    return lastError && lastError.message;
  };

  this.headline = function () {
    return lastError && lastError.headline;
  };

  this.retry = function () {
    var e = lastError;
    self.dismiss();
    return e.retry();
  };

  this.goBack = function () {
    var e = lastError;
    self.dismiss();
    return e.goBack();
  };

  this.object = function () {
    return lastError;
  };

  this.debuggable = function () {
    return lastError && lastError.debuggable;
  };

  this.dismiss = function () {
    lastError = false;
  };
})
.controller('ErrorCtrl', function (prxError) {
  this.show = prxError.hasError;
  this.canRetry = prxError.canRetry;
  this.canGoBack = prxError.canGoBack;
  this.goBack = prxError.goBack;
  this.retry = prxError.retry;
  this.headline = prxError.headline;
  this.message = prxError.message;
  this.object = prxError.object;
  this.debuggable = prxError.debuggable;
});
