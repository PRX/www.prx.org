/* istanbul ignore next */
if (FEAT.TCF_DEMO) {
  angular.module('prx.upload', ['angular-dnd'])
  .config(function ($stateProvider) {
    $stateProvider.state('upload', {

    }).state('upload.new_story', {
        url: '/upload',
        title: 'Create Your Story',
        params: {uploads: []},
        views: {
          '@': {
            templateUrl: 'upload/upload.html',
            controller: 'UploadCtrl as upload'
          }
        }
      }
    );
  })
  .service('UploadTarget', function ($rootScope) {
    var targets = [],
        active  = {};

    this.registerTarget = function (targetName) {
      if (targets.indexOf(targetName) == -1) {
        targets.push(targetName);
        active[targetName] = false;
      }
    };

    this.targetActive = function (targetName) {
      return !!active[targetName];
    };

    this.showTarget = function (targetName) {
      if (targets.indexOf(targetName) !== -1) {
        active[targetName] = true;
      }
    };

    this.dismissTarget = function (targetName) {
      if (targets.indexOf(targetName) !== -1) {
        active[targetName] = false;
      }
    };

    this.deregisterTarget = function (targetName) {
      if (targets.indexOf(targetName) !== -1) {
        targets.splice(targets.indexOf(targetName), 1);
        active[targetName] = undefined;
      }
    };

    $rootScope.$on('$stateChangeStart', function () {
      angular.forEach(active, function (val, key) {
        active[key] = false;
      });
    });
  })
  .directive('prxFileTarget', function () {
    return {
      restrict: 'E',
      priority: 1000,
      templateUrl: "upload/file_target.html",
      replace: true,
      scope: {
        targetName: '@name'
      },
      controller: 'prxFileTargetCtrl',
      controllerAs: 'target',
      bindToController: true
    };
  })
  .directive('prxFileSelect', function () {
    return {
      restrict: 'A',
      require: '^prxFileTarget',
      link: function (scope, elem, attrs, ctrl) {
        ctrl.selectFiles = function () {
          elem[0].click();
        };
      }
    };
  })
  .service('Validate', function ValidateService($timeout, $q) {
    var invalidatedOnce = false;

    function validationResult (file) {
      return function () {
        if (invalidatedOnce) {
          return file;
        } else {
          invalidatedOnce = true;
          return $q.reject({error: "MP3 bitrate too low!", file: file});
        }
      };
    }

    this.validate = function (file) {
      return $timeout(angular.noop, Math.random() * 1500 + 500).then(validationResult(file));
    };
  })
  .service('Upload', function UploadService($interval) {
    var activeUploads = [], intervalScheduled = false;

    function Upload(file) {
      this.file = file;
      this.progress = 0;
      activeUploads.push(this);
      scheduleInterval();
    }

    this.upload = function (file) {
      return new Upload(file);
    };

    function scheduleInterval() {
      if (!intervalScheduled) {
        intervalScheduled = $interval(increaseUploads, 200);
      }
    }

    function increaseUploads() {
      if (activeUploads.length) {
        activeUploads[0].progress += Math.random() * 10 + 1;
        if (activeUploads[0].progress >= 100) {
          activeUploads[0].progress = 100;
          activeUploads.splice(0, 1);
        }
      } else {
        $interval.cancel(intervalScheduled);
        intervalScheduled = false;
      }
    }
  })
  .controller('prxFileTargetCtrl', function (UploadTarget, $scope, Upload, Validate, $state, $q, $timeout) {
    var ctrl = this, errorClearer;

    var MESSAGES = {
      NO_DRAG: "Drag Files Here",
      DRAG: "Drop Files Here to Upload",
      DROPPED: "Analyzing..."
    };

    UploadTarget.registerTarget(this.targetName);

    this.visible = function () {
      return UploadTarget.targetActive(this.targetName);
    };

    this.message = MESSAGES.NO_DRAG;

    this.updateMessage = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.message != MESSAGES.DRAG) {
        this.message = MESSAGES.DRAG;
      }
    };

    this.filesDropped = function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.message = MESSAGES.DROPPED;
      var validations = [];
      if (errorClearer) {
        $timeout.cancel(errorClearer);
        clearError();
      }
      angular.forEach(event.dataTransfer.files, function (file) {
        validations.push(Validate.validate(file));
      });
      $q.all(validations).then(function (validFiles) {
        angular.forEach(validFiles, function (file, index) {
          validFiles[index] = Upload.upload(file);
        });
        return validFiles;
      }, function (validationError) {
        ctrl.message = MESSAGES.NO_DRAG;
        ctrl.errorMessage = validationError.error;
        errorClearer = $timeout(clearError, 5000);
        return errorClearer.then(function () {
          return $q.reject(validationError.error);
        });
      }).then(function (uploads) {
        $state.go('upload.new_story', {uploads: uploads});
      });
    };

    this.showFileSelect = function () {
      return this.message == MESSAGES.NO_DRAG;
    };

    this.dragLeave = function () {
      this.message = MESSAGES.NO_DRAG;
    };

    this.busy = function () {
      return this.message == MESSAGES.DROPPED;
    };

    $scope.$on("$destroy", function () {
      UploadTarget.deregisterTarget(targetName);
    });

    function clearError () {
      ctrl.errorMessage = null;
      errorClearer = null;
    }
  })
  .controller('UploadCtrl', function () {
  })
  .directive('onPageScroll', function ($window) {
    return {
      restrict: 'A',
      controller: function () {
        this.root = null;

        this.statusBar = undefined;
        this.statusBarPlaceholder = undefined;

        this.inspectors = [];
        this.inspectorPlaceholders = [];


        this.registerStatusBar = function (elem) {
          this.statusBar = elem;
        };
        this.registerStatusBarPlaceholder = function (elem) {
          this.statusBarPlaceholder = elem;
        };
        this.registerInspector = function (elem) {
          this.inspectors.push(elem);
        };
        this.registerInspectorPlaceholder = function (elem) {
          this.inspectorPlaceholders.push(elem);
        };

        this.findPosX = function (obj) {
          var curleft = 0;

          if(obj.offsetParent) {
            while(1) {
              curleft += obj.offsetLeft;

              if(!obj.offsetParent) {
                break;
              }

              obj = obj.offsetParent;
            }
          } else if (obj.x) {
            curleft += obj.x;
          }

          return curleft;
        };

        this.findPosY = function (obj) {
          var curtop = 0;

          if (obj.offsetParent) {
            while(1) {
              curtop += obj.offsetTop;

              if(!obj.offsetParent) {
                break;
              }

              obj = obj.offsetParent;
            }
          } else if (obj.y) {
            curtop += obj.y;
          }

          return curtop;
        };

        this.positionInspectors = function () {
          for (i = 0; i < this.inspectors.length; i++) {

            _placeholder = this.inspectorPlaceholders[i][0];
            _inspector = this.inspectors[i][0];

            _nextInspector = undefined;
            if (this.inspectors[i + 1]) {
              _nextInspector = this.inspectors[i + 1][0];
            }

            pageY = $window.pageYOffset;

            verticalOffset = 153;
            topMargin = 30;

            y = this.findPosY(_placeholder);

            if (pageY + verticalOffset > y) {
              // Has scrolled past the static location of the inspector,
              // so we need to figure out where to display it

              // Figure out if there's collision between the display location of
              // this inspector and the static location of the next inspector

              if ((typeof _nextInspector != 'undefined')) {
                nextY = this.findPosY(_nextInspector);

                collisionY = nextY - (verticalOffset + topMargin + _inspector.offsetHeight);
                adjCollisionY = (collisionY - 208);

                if (pageY > adjCollisionY) {
                  // Push the inspector off screen as necessary

                  distPastCollisionY = (pageY - adjCollisionY);
                  _y = (verticalOffset + topMargin) - distPastCollisionY;

                  _inspector.style.position = "fixed";
                  _inspector.style.top = _y + "px";
                  _inspector.style.left = 'initial';
                  _inspector.style.marginLeft = "-255px";
                } else {
                  // Pin the current header to the top of the view
                  _inspector.style.position = "fixed";
                  _inspector.style.top = (verticalOffset + topMargin) + "px";
                  _inspector.style.left = 'initial';
                  _inspector.style.marginLeft = "-255px";
                }

                // pushY = ();


              } else {
                // Pin the current header to the top of the view
                _inspector.style.position = "fixed";
                _inspector.style.top = (verticalOffset + topMargin) + "px";
                _inspector.style.left = 'initial';
                _inspector.style.marginLeft = "-255px";
              }
            } else {
              // Reset the inspector's styles
              _inspector.style.removeProperty('marginLeft');
              _inspector.style.removeProperty('margin');
              _inspector.style.removeProperty('position');
              _inspector.style.removeProperty('top');
              _inspector.style.removeProperty('left');
            }
          }
        };

        this.positionStatusBar = function () {
          bar = this.statusBar[0];
          placeholder = this.statusBarPlaceholder[0];

          if ($window.pageYOffset + 73 > this.findPosY(placeholder)) {
            placeholder.style.height = bar.offsetHeight + 'px';
            bar.style.position = "fixed";
            bar.style.top = "73px";
          } else {
            placeholder.style.height = '0px';
            bar.style.position = 'static';
            bar.style.removeProperty('top');
          }
        };
      },
      link: function (scope, elem, attrs, ctrl) {
        ctrl.root = elem[0];

        angular.element($window).on('scroll', function (event) {
          ctrl.positionStatusBar();
          ctrl.positionInspectors();
        });
      }
    };
  })
  .directive('statusBar', function () {
    return {
      restrict: 'A',
      require: '^onPageScroll',
      link: function (scope, elem, attrs, ctrl) {
        ctrl.registerStatusBar(elem);
      }
    };
  })
  .directive('statusBarPlaceholder', function () {
    return {
      restrict: 'A',
      require: '^onPageScroll',
      link: function (scope, elem, attrs, ctrl) {
        ctrl.registerStatusBarPlaceholder(elem);
      }
    };
  })
  .directive('inspector', function () {
    return {
      restrict: 'A',
      require: '^onPageScroll',
      link: function (scope, elem, attrs, ctrl) {
        ctrl.registerInspector(elem);
      }
    };
  })
  .directive('inspectorPlaceholder', function () {
    return {
      restrict: 'A',
      require: '^onPageScroll',
      link: function (scope, elem, attrs, ctrl) {
        ctrl.registerInspectorPlaceholder(elem);
      }
    };
  });
}