"use strict"
$("document").ready(function () {

  /////////////////////////////////////////
  //ADD BOOKS
  $("#bookslist").on("click", () => {
    let ele = $("#bookslist");
    if (!ele.hasClass('active') && $("#booksearch").hasClass('active')) {
      $("#booksearch").removeClass('active');
      $(".addbook").removeClass('active');
      $(".mybooks").addClass('active');
      ele.addClass('active');
    }
  });

  $("#booksearch").on("click", () => {
    let ele = $("#booksearch");
    if (!ele.hasClass('active') && $("#bookslist").hasClass('active')) {
      $("#bookslist").removeClass('active');
      $(".mybooks").removeClass('active');
      $(".addbook").addClass('active');
      ele.addClass('active');
    }
  });

  let alertMessage = (ele,type, message) => {
    if ($(ele).length > 0) {
      $(ele).empty();
    }
    if (message) {
      $(ele).append(`<p class="alert-default alert-default-${type}">${message}</p>`);
    }
  }

  let appendData = (parent, attr, ele, icon, method) => {
    $(`${parent}`).append(`
    <div class="col-lg-3 col-md-4 col-sm-6" data-${attr}-id="${ele.id}">
         <div class="book-card">
             <div class="book-card__top">
                 <img class="book-card__top__img" src="${ele.image}" alt="Book Image">
                 <span class="book-card__top__date">${ele.date}</span>
                 <a class="book-card__top__info" href="${ele.url}" target="_blank"> More Info</a>
             </div>
             <div class="book-card__bottom">
                 <h2 class="book-card__bottom__title">${ele.title}</h2>
                 <p class="book-card__bottom__author">
                     <i class="fa fa-pencil-square-o" aria-hidden="true"></i> ${ele.authors}</p>
                 <div class="text-center">
                     <a id="${ele.id}" class="btn btn-default btn-default-green ${method}">
                         <i class="fa ${icon}" aria-hidden="true"></i>
                     </a>
                 </div>
             </div>
         </div>
   </div>
  `);
  }

  let lastSearch = "";
  $("#booksAddSearch").keypress((e) => {
    if (e.which === 13) {
      let input = $("#booksAddSearch").val().trim();
      if (input === "") {
        alertMessage(".alerts","info", "Fill the input to search for books");
      } else {
        if (lastSearch !== input) {
          $("#addbook").empty();
          $(".sk-circle").css("display", "block");
          $.getJSON(`/user/books/search/${input}`, ((data) => {
            $(".sk-circle").css("display", "none");
            if (data && data.error) {
              alertMessage(".alerts","danger", data.error);
            } else if (data && data.message) {
              alertMessage(".alerts","info", data.message);
            } else if (data) {
              alertMessage(".alerts");
              data.forEach((ele) => {
                appendData("#addbook", "ele", ele, "fa-plus-circle", "addtobooks");
              });
            }
          }));
          lastSearch = input;
        }
      }
    }
  });

  $("#addbook").on("click", ".addtobooks", function () {
    let id = this.id;
    $(`#${id}`).css("pointer-events", "none");
    $.getJSON(`/user/books/add/${id}`, ((data) => {
      if (data && data.error) {
        alertMessage(".alerts","danger", data.error);
        $(`#${id}`).css("pointer-events", "auto");
      } else if (data) {
        if ($("#empty").length > 0) {
          $("#empty").remove();
        }
        appendData(".mybooks", "book", data, "fa-trash-o", "remove");
        $(`[data-ele-id="${id}"]`).fadeOut();
        alertMessage(".alerts","success", "Book added with success to your books");
      }
    }));
  });

  /////////////////////////////////////////
  //REMOVE BOOKS
  $(".mybooks").on("click", ".remove", function (e) {
    let id = this.id;
    $.getJSON(`/user/books/remove/${id}`, ((data) => {
      if (data && data.message) {
        $(`[data-book-id="${id}"]`).fadeOut();
        if ($(".alertsDelete").length > 0) {
          $(".alertsDelete").empty();
        }
        $(".alertsDelete").append(`<p class="alert-default alert-default-success mb-4">${data.message}</p>`);
      }
    }));
  });

  /////////////////////////////////////////
  //SEARCH BOOK
  $("#bookListSearch").keypress((e) => {
    if (e.which === 13) {
      let input = $("#bookListSearch").val().trim();
      if (input === "") {
        alertMessage(".alerts","info", "Fill the input to search for books");
      } else {
        if (lastSearch !== input) {
          $("#bookslist-two").empty();
          $(".sk-circle").css("display", "block");
          $.getJSON(`/books/search/${input}`, ((data) => {
            $(".sk-circle").css("display", "none");
            if (data && data.error) {
              alertMessage(".alerts","danger", data.error);
            } else if (data) {
              alertMessage(".alerts");
              data.forEach((ele) => {
                let bookOwners = ele.owners.reduce((acc, ele) => {
                  return acc + `<option value="${ele.user_id}">${ele.username}</option>`
                }, "");
                $("#bookslist-two").append(`
                <div class="col-lg-3 col-md-4 col-sm-6" data-book="${ele.id}">
                <div class="book-card">
                    <div class="book-card__top">
                        <img class="book-card__top__img" src="${ele.image}" alt="Book Image">
                        <span class="book-card__top__date">${ele.date}</span>
                        <a class="book-card__top__info" href="${ele.url}"> More Info</a>
                    </div>
                    <div class="book-card__bottom">
                        <h2 class="book-card__bottom__title">${ele.title}</h2>
                        <p class="book-card__bottom__author">
                            <i class="fa fa-pencil-square-o" aria-hidden="true"></i> ${ele.authors}</p>
                        <div class="text-center">
                            <a data-toggle="modal" data-target="#${ele.id}" class="btn btn-default btn-default-green">
                                TRADE
                            </a>
                            <div class="modal fade" id="${ele.id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                <div class="modal-dialog modal-dialog-default" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabel">Choose one user to trade with:</h5>
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <select class="custom-select" data-select="${ele.id}">
                                                ${bookOwners}
                                            </select>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">
                                                <i class="fa fa-times" aria-hidden="true"></i>
                                            </button>
                                            <button type="button" class="btn btn-info request" data-id="${ele.id}">
                                                <i class="fa fa-check" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`)
              });
            }
          }));
          lastSearch = input;
        }
      }
    }
  });

  /////////////////////////////////////////
  //REQUEST MENU
  $("#nav-user-requests").on("click", function () {
    if (!$("#nav-user-requests").hasClass("active")) {
      $("#nav-my-requests").removeClass("active");
      $("#nav-user-requests").addClass("active");
      $("#myrequests").fadeOut();
      $("#userRequests").delay(600).fadeIn();
    };
  });

  $("#nav-my-requests").on("click", function () {
    if (!$("#nav-my-requests").hasClass("active")) {
      $("#nav-user-requests").removeClass("active");
      $("#nav-my-requests").addClass("active");
      $("#userRequests").fadeOut();
      $("#myrequests").delay(600).fadeIn();
    };
  });

  /////////////////////////////////////////
  //REQUEST TRADE
  $("#bookslist-two").on("click", ".request", function () {
    let bookId = $(this).attr("data-id");
    let userid = $(`[data-select="${bookId}"] option:selected`).val().trim();
    let container = $(`[data-book="${bookId}"]`);
    $.getJSON(`books/${bookId}/${userid}`, ((data) => {
      $(".close").click();
      if (data && data.error) {
        alertMessage(".alerts","danger", data.error);
      } else if (data) {
        alertMessage(".alerts","success", data.message);
        container.fadeOut();
      }
    }));
  });

  /////////////////////////////////////////
  //DELETE MY REQUESTS
  $(".remove").on("click",function(){
    let requestID = $(this).attr("data-id");
    $.getJSON(`/user/requests/delete/${requestID}`,((data)=>{
      if(data){
        $(`[data-book-2="${requestID}"]`).fadeOut();
        alertMessage(".alerts-user-requests","success",data.message);
      }else{
        alertMessage(".alerts-user-requests","danger","Something went wrong,please refresh the page");
      }
    }));
  });

  /////////////////////////////////////////
  //SELECT BOOK - MY REQUESTS
  let lastClicked = "";
  $(".choose").on("click",function(){
    lastClicked = $(this).attr("data-choose");
    console.log(lastClicked);
  });

  $(".setBook").on("click",()=>{
    let element = $('[data-select="userBooksAvaible"]');
    let option = $('[data-select="userBooksAvaible"] option:selected');
    let val = option.val();
    option.remove();
    if(element.find("option").length === 0){
      $(".setBook").remove();
      element.parent().append('<p class="lead">You have no books avaible to trade</p>');
      element.remove();
    }
    if(val){
      $.getJSON("")
    }
  });
});