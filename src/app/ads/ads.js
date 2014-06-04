angular.module('prx.ads', [])

.directive('prxAd', function($window, $timeout) {
  return {
    restrict: 'E',
    replace: true,
    template: "<div class='slot'/>",
    controller: function Controller() {
      var timeoutPromise;
      var self = this;
      this.win = angular.element($window);
      this.width = this.height = 0;
      this.reload = function(gSlot, newwidth, newheight) {
        if (timeoutPromise) {
          $timeout.cancel(timeoutPromise);
        }
        timeoutPromise = $timeout(function() {
          if (self.width != newwidth || self.height != newheight) {
            self.width = newwidth;
            self.height = newheight;
            if (angular.isDefined($window.googletag)) {
              gSlot.defineSizeMapping([[[0,0],[self.width,self.height]]]);
              $window.googletag.pubads().refresh([gSlot]);
            }
          }
        }, 5);
      };
    },
    link: function(scope, elem, attrs, ctrl) {
      elem.attr('id', 'div-gpt-ad-' + Math.random().toString(36).substr(2, 9));
      ctrl.width = elem[0].offsetWidth;
      ctrl.height = elem[0].offsetHeight;
      if (angular.isDefined($window.googletag)) {
        $window.googletag.cmd.push(function() {
          gSlot = $window.googletag.defineSlot(attrs.slot, [ctrl.width, ctrl.height], elem.attr('id')).addService($window.googletag.pubads());
          gSlot.defineSizeMapping([[[0,0],[ctrl.width,ctrl.height]]]);
          $window.googletag.enableServices();
          $window.googletag.display(elem.attr('id'));
        });
        ctrl.doReload = function() {
          ctrl.reload(gSlot, elem[0].offsetWidth, elem[0].offsetHeight);
        };
        ctrl.win.on('resize', ctrl.doReload);
        scope.$on('$destroy', function () {
          ctrl.win.off('resize', ctrl.doReload);
        });
      } else {
        elem.css('background-color', 'grey');
      }
    }
  };
})

;
