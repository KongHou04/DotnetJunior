var app = angular.module("myApp", ["ngRoute", "ui.bootstrap"]);
app.config([
  "$routeProvider",
  function ($routeProvider) {
    $routeProvider
      .when("/home", {
        templateUrl: "views/home.html",
        controller: "HomeController",
      })
      .when("/courses", {
        templateUrl: "views/courses.html",
        controller: "CoursesController",
      })
      .when("/details/:id", {
        templateUrl: "views/details.html",
        controller: "DetailsController",
      })
      .when("/search/:searchText", {
        templateUrl: "views/search.html",
        controller: "SearchController",
      })
      .when("/user", {
        templateUrl: "views/user.html",
        controller: "UserController",
      })
      .otherwise({
        redirectTo: "/home",
      });
  },
]);

app.controller("HeaderController", [
  "$scope",
  "$http",
  "$location",
  "$rootScope",
  function ($scope, $http, $location, $rootScope) {
    $scope.onEnterKeyPressed = function (text) {
      if (text.length != 0) $location.path("/search/" + text);
      $scope.searchText = "";
    };
    // $scope.turnOnLogin = function(){
    //   $rootScope.isLoginModalShow = true;
    // }
    $rootScope.calculateProgressBarWidth = function (currnet, max) {
      const percentage = (currnet / max) * 100;
      console.log(percentage);
      return percentage + "%";
    };

    $rootScope.joinCourse = function(course){
      if ($rootScope.loggedInUser == undefined){
        alert('Please login first');
        return;
      }
      console.log('Course is: ');
      console.log(course);
      let isValid = true;
      $rootScope.userCourses.forEach(element => {
        if (element.courseId == course.id){
          isValid = false;
        }
      }); 
      if (isValid == false){
        alert('You already joined this course');
        return;
      }
      $rootScope.userCourses.push({
        courseId: course.id,
        courseDetails: course,
        progress: [1, 1, 1]
      })
      $rootScope.userCourseManager.courses.push({
        courseId: course.id,
        progress: [1, 1, 1]
      })
      $http({
        method: 'PUT',
        url: 'http://localhost:3002/cms/' + $rootScope.userCourseManager.id,
        data: $rootScope.userCourseManager
      }).then(function(response){
      })
      alert('You have joined a new course');
    }
  },
]);

app.controller("HomeController", [
  "$scope",
  "$http",
  "$rootScope",
  function ($scope, $http, $rootScope) {
    $rootScope.scrollToTop = function () {
      document.body.scrollTop = 0; // Cho trình duyệt không phải là Firefox
      document.documentElement.scrollTop = 0; // Cho trình duyệt Firefox
    };
    $http
      .get("http://localhost:3000/courses/")
      .then(function (response) {
        $scope.allCourses = response.data;

        // Sắp xếp mảng theo thuộc tính view giảm dần
        $scope.allCourses.sort(function (a, b) {
          return b.view - a.view;
        });

        // Lấy ra 5 khoá học có lượt xem nhiều nhất
        $scope.mostViewedCourses = $scope.allCourses.slice(0, 9);
      })
      .catch(function (error) {
        console.error("Error loading courses:", error);
      });
  },
]);

app.controller("CoursesController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.sortProperties = ["Sort by r.Date", "Sort by View", "Sort by Title"];
    $scope.selectedSortProperty = $scope.sortProperties[0];

    $scope.totalPage;
    $scope.pageSize = 9;
    $scope.currentPage = 1;
    $scope.visiblePages;
    $scope.pagedItems;
    $http
      .get("http://localhost:3000/courses/")
      .then(function (response) {
        $scope.allCourses = response.data;
        $scope.allCourseLength = $scope.allCourses.length;
        $scope.totalPage = Math.ceil($scope.allCourseLength / $scope.pageSize);
        console.log("total Page" + $scope.totalPage);
        console.log("total Item" + $scope.allCourses.length);
        $scope.sortData();
      })
      .catch(function (error) {
        console.error("Error loading courses:", error);
      });

    $scope.sortData = function () {
      switch ($scope.selectedSortProperty) {
        case $scope.sortProperties[0]: // Sắp xếp theo Release Date
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return new Date(a.releaseDate) - new Date(b.releaseDate);
          });
          break;
        case $scope.sortProperties[1]: // Sắp xếp theo View
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return b.view - a.view;
          });
          break;
        case $scope.sortProperties[2]: // Sắp xếp theo Title
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return a && a.title && b && b.title
              ? a.title.localeCompare(b.title)
              : 0;
          });
          break;
      }
      $scope.changePage(1);
    };

    function getVisiblePages() {
      let min = $scope.currentPage - 2;
      let max = $scope.currentPage + 2;
      min = min < 1 ? 1 : min;
      max = max > $scope.totalPage ? $scope.totalPage : max;
      let v_pages = [];
      for (let i = min; i <= max; i++) {
        v_pages.push(i);
      }
      $scope.visiblePages = v_pages;
    }

    $scope.changePage = function (page) {
      $scope.currentPage = page;
      if (isNaN(page) || page <= 0) {
        console.error("Error loading courses: Invalid page number.");
        return;
      }
      let startIndex = 1;
      startIndex = (page - 1) * $scope.pageSize;
      let endIndex = 1;
      endIndex = Math.min(
        startIndex + $scope.pageSize - 1,
        $scope.allCourseLength - 1
      );
      console.log($scope.pageSize);
      console.log($scope.allCourseLength);
      console.log(startIndex);
      console.log(endIndex);
      $scope.pagedItems = $scope.allCourses.slice(startIndex, endIndex + 1);
      console.log($scope.pagedItems);
      getVisiblePages();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    $scope.isCurrentPage = function (p) {
      return p === $scope.currentPage ? true : false;
    };
  },
]);

app.controller("DetailsController", [
  "$scope",
  "$rootScope",
  "$routeParams",
  "$http",
  function ($scope, $rootScope, $routeParams, $http) {
    $scope.id = $routeParams.id;
    $http({
      method: "GET",
      url: "http://localhost:3000/courses/" + $scope.id,
    })
      .then(function (response) {
        $scope.course = response.data;
        $scope.course.view++;
        console.log($scope.course.view);
        console.log($scope);
        return $http({
          method: "PUT",
          url: "http://localhost:3000/courses/" + $scope.id,
          data: $scope.course,
        });
      })
      .catch(function (error) {
        console.error("Error loading course details:", error);
      });
  },
]);

app.controller("SearchController", [
  "$scope",
  "$routeParams",
  "$http",
  function ($scope, $routeParams, $http) {
    $scope.searchText = $routeParams.searchText;
    $scope.sortProperties = ["Sort by r.Date", "Sort by View", "Sort by Title"];
    $scope.selectedSortProperty = $scope.sortProperties[0];

    $scope.totalPage;
    $scope.pageSize = 9;
    $scope.currentPage = 1;
    $scope.visiblePages;
    $scope.pagedItems;
    $http
      .get("http://localhost:3000/courses/")
      .then(function (response) {
        $scope.allCourses = response.data.filter(function (item) {
          return item.title
            .toLowerCase()
            .includes($scope.searchText.toLowerCase());
        });
        $scope.allCourseLength = $scope.allCourses.length;
        $scope.totalPage = Math.ceil($scope.allCourseLength / $scope.pageSize);
        console.log("total Page" + $scope.totalPage);
        console.log("total Item" + $scope.allCourses.length);
        $scope.sortData();
      })
      .catch(function (error) {
        console.error("Error loading courses:", error);
      });

    $scope.sortData = function () {
      switch ($scope.selectedSortProperty) {
        case $scope.sortProperties[0]: // Sắp xếp theo Release Date
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return new Date(a.releaseDate) - new Date(b.releaseDate);
          });
          break;
        case $scope.sortProperties[1]: // Sắp xếp theo View
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return b.view - a.view;
          });
          break;
        case $scope.sortProperties[2]: // Sắp xếp theo Title
          $scope.allCourses = $scope.allCourses.sort(function (a, b) {
            return a.title.localeCompare(b.title);
          });
          break;
      }
      $scope.changePage(1);
    };

    function getVisiblePages() {
      let min = $scope.currentPage - 2;
      let max = $scope.currentPage + 2;
      min = min < 1 ? 1 : min;
      max = max > $scope.totalPage ? $scope.totalPage : max;
      let v_pages = [];
      for (let i = min; i <= max; i++) {
        v_pages.push(i);
      }
      $scope.visiblePages = v_pages;
    }

    $scope.changePage = function (page) {
      $scope.currentPage = page;
      if (isNaN(page) || page <= 0) {
        console.error("Error loading courses: Invalid page number.");
        return;
      }
      let startIndex = 1;
      startIndex = (page - 1) * $scope.pageSize;
      let endIndex = 1;
      endIndex = Math.min(
        startIndex + $scope.pageSize - 1,
        $scope.allCourseLength - 1
      );
      console.log($scope.pageSize);
      console.log($scope.allCourseLength);
      console.log(startIndex);
      console.log(endIndex);
      $scope.pagedItems = $scope.allCourses.slice(startIndex, endIndex + 1);
      console.log($scope.pagedItems);
      getVisiblePages();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    $scope.isCurrentPage = function (p) {
      return p === $scope.currentPage ? true : false;
    };
  },
]);

app.controller("BannerController", [
  "$scope",
  function ($scope) {
    $scope.initTypedJS = function () {
      var options = {
        strings: ["DotnetJunior", "Dotnet", "Our Website"],
        typeSpeed: 600, // Tốc độ gõ chữ (milliseconds)
        backSpeed: 800, // Tốc độ xóa chữ (milliseconds)
        loop: true, // Lặp lại
      };
      var typed = new Typed(".logo-name", options);
    };
    $scope.initTypedJS();
  },
]);

app.controller("LoginController", [
  "$scope",
  "$http",
  "$rootScope",
  "$location",
  "$uibModal",
  function ($scope, $http, $rootScope, $location, $uibModal) {
    var swiper = new Swiper(".myLoginSwiper", {
      allowTouchMove: false,
      speed: 1500,
      navigation: {
        nextEl: ".swiper-button-signIn",
        prevEl: ".swiper-button-logIn",
      },
    });

    $scope.login = {
      userName: "superadmin",
      password: "admin123123",
      userNameError: "",
      passwordError: "",
    };
    $scope.signIn = {
      userNameError: "",
      passwordError: "",
      rePasswordError: "",
      emailError: "",
    };

    $scope.checkLogin = function () {
      let errorNumber = 0;
      console.log($scope.login.userName);
      console.log($scope.login.password);
      if (!$scope.checkUserName($scope.login.userName)) {
        errorNumber++;
        $scope.login.userNameError = "Username is invalid (>10, no space)";
      } else $scope.login.userNameError = "";

      if (!$scope.checkPassword($scope.login.password)) {
        errorNumber++;
        $scope.login.passwordError = "Password is invalid (>10, no space)";
      } else $scope.login.passwordError = "";
      console.log($scope.login.userNameError);
      console.log($scope.login.passwordError);
      return errorNumber == 0 ? true : false;
    };

    $scope.checkSignIn = function () {
      let errorNumber = 0;
      if (!$scope.checkUserName($scope.userNameSignIn)) {
        errorNumber++;
        $scope.signIn.userNameError = "Username is invalid (>10, no space)";
      } else $scope.signIn.userNameError = "";

      if (!$scope.checkPassword($scope.passwordSignIn)) {
        errorNumber++;
        $scope.signIn.passwordError = "Password is invalid (>10, no space)";
      } else {
        $scope.signIn.passwordError = "";
        if (
          !$scope.checkPasswordIsSame(
            $scope.passwordSignIn,
            $scope.rePasswordSignIn
          )
        ) {
          errorNumber++;
          $scope.signIn.rePasswordError = "Passwords is not the same";
        } else {
          $scope.signIn.rePasswordError = "";
        }
      }

      if (!$scope.checkEmail($scope.emailSignIn)) {
        errorNumber++;
        $scope.signIn.emailError = "Email is not match the Format";
      } else $scope.signIn.emailError = "";

      return errorNumber == 0 ? true : false;
    };

    $scope.checkUserName = function (userName) {
      if (userName == undefined || userName.length == 0) {
        return false;
      }
      if (userName.length < 10) {
        return false;
      }
      if (userName.includes(" ")) {
        return false;
      }
      return true;
    };
    $scope.checkPassword = function (password) {
      if (password == undefined || password.length == 0) {
        return false;
      }
      if (password.length < 10) {
        return false;
      }
      if (password.includes(" ")) {
        return false;
      }
      return true;
    };
    $scope.checkPasswordIsSame = function (password, rePassword) {
      if (password !== rePassword) {
        notification = "Passwords was not match each other";
        return false;
      }
      return true;
    };
    $scope.checkEmail = function (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    $scope.loginFunc = function () {
      if (!$scope.checkLogin()) return;
      $http({
        method: "GET",
        url:
          "http://localhost:3001/users/?userName=" +
          $scope.login.userName +
          "&&password=" +
          $scope.login.password,
      })
        .then(function (response) {
          if (response.data.length != 0) {
            $scope.user = response.data[0];
            $rootScope.loggedInUser = $scope.user;
            $rootScope.isLogged = true;
            console.log("Login successfully");
            $http({
              method: "GET",
              url: "http://localhost:3002/cms/" + $scope.loggedInUser.id,
            }).then(function (response) {
              $rootScope.userCourseManager = response.data;
              $rootScope.userCourses = [];
              console.log(response.data);
              for (let i = 0; i < response.data.courses.length; i++) {
                let c = {
                  id: '',
                  courseDetails: '',
                  progress: [],
                };
                c.courseId = response.data.courses[i].courseId;
                c.progress = response.data.courses[i].progress;
                $http({
                  method: "GET",
                  url:
                    "http://localhost:3000/courses/" +
                    response.data.courses[i].courseId,
                }).then(function (response) {
                  c.courseDetails = response.data;
                }),
                $rootScope.userCourses.push(c);
                // $rootScope.userCourses.push({
                //   id: response.data.courses[i].courseId,
                //   title: $http({
                //     method: "GET",
                //     url:
                //       "http://localhost:3000/courses/" +
                //       response.data.courses[i].courseId,
                //   }).then(function (response) {
                //     return response.data.title;
                //   }),
                //   progress: response.data.courses[i].progress,
                // });
              }

              console.log("Courses are");
              console.log($rootScope.userCourses);
              // for (let i = 0; i < $rootScope.userCourses.courses.length; i++) {
              //   $http({
              //     method: "GET",
              //     url:
              //       "http://localhost:3000/courses/" +
              //       $rootScope.userCourses.courses[i].courseId,
              //   }).then(function (response) {
              //     console.log(response.data);
              //     console.log("hei");
              //     $rootScope.userCourses.course[i].name = response.data.title;
              //   });
              // }
            });
            console.log($scope.user);
            console.log("data from root: " + $rootScope.loggedInUser.userName);
            // $location.path('/courses');
            // Lấy đối tượng backdrop
            // Kiểm tra xem backdrop có tồn tại không
          } else {
            console.log("not good");
          }
        })
        .catch(function (error) {
          console.error("Error login:", error);
        });
    };

    $scope.signInFunc = function () {
      if (!$scope.checkSignIn()) return;
      let existUser = false;
      $http({
        method: "GET",
        url: "http://localhost:3001/users/?userName=" + $scope.userNameSignIn,
      }).then(function (response) {
        // Nếu tìm thấy người dùng, đặt existUser thành true
        if (response.data.length > 0) {
          existUser = true;
        }

        // Kiểm tra người dùng theo email nếu existUser vẫn là false
        if (!existUser) {
          $http({
            method: "GET",
            url: "http://localhost:3001/users/?email=" + $scope.emailSignIn,
          }).then(function (response) {
            // Nếu tìm thấy người dùng, đặt existUser thành true
            if (response.data.length > 0) {
              existUser = true;
            }

            // Nếu người dùng tồn tại, hiển thị thông báo và kết thúc hàm
            if (existUser) {
              alert("User already exists.");
            } else {
              $http({
                method: "POST",
                url: "http://localhost:3001/users",
                data: {
                  userName: $scope.userNameSignIn,
                  password: $scope.passwordSignIn,
                  email: $scope.emailSignIn,
                  phone: "",
                },
              }).then(
                function (response) {
                  alert('go here');
                  var id = response.data.id;
                  $http({
                    method: "POST",
                    url: "http://localhost:3002/cms",
                    data: {
                      id: id,
                      courses: []
                    },
                  }).then(function(response){
                    alert("Account created successfully!");
                  });
                },
                function (error) {
                  // Xử lý lỗi nếu có
                  alert("Error creating account: " + error.data.message);
                }
              );
            }
          });
        } else {
          alert("User already exists.");
        }
      });
    };
  },
]);

app.controller("UserController", [
  "$scope",
  "$rootScope",
  "$http",
  "$routeParams",
  function ($scope, $rootScope, $http, $routeParams) {
    // $scope.getCourseName = function(id){
    //   $http({
    //     method: "GET",
    //     url: "http://localhost:3000/courses/" + id
    //   }).then(function(response){
    //     return response.data;
    //   })
    // }

    $scope.quitCourse = function(index){
      $rootScope.userCourses.splice(index, 1);
      $rootScope.userCourseManager.courses.splice(index, 1);
      $http({
        method: 'PUT',
        url: 'http://localhost:3002/cms/' + $rootScope.userCourseManager.id,
        data: $rootScope.userCourseManager
      }).then(function(response){
        
      })
    }
  },
]);
