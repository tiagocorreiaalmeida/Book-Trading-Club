$("document").ready(function(){

  //ADD BOOKS
  $("#bookslist").on("click",()=>{
    let ele = $("#bookslist");
    if(!ele.hasClass('active') && $("#booksearch").hasClass('active')){
      $("#booksearch").removeClass('active');
      $(".addbook").removeClass('active');
      $(".mybooks").addClass('active');
      ele.addClass('active');
    }
  });

  $("#booksearch").on("click",()=>{
    let ele = $("#booksearch");
    if(!ele.hasClass('active') && $("#bookslist").hasClass('active')){
      $("#bookslist").removeClass('active');
      $(".mybooks").removeClass('active');
      $(".addbook").addClass('active');
      ele.addClass('active');
    }
  });

  let alertMessage = (type,message)=>{
    if($(".alerts").length > 0){
      $(".alerts").empty();
    }
    if(message){
      $(".alerts").append(`<p class="alert-default alert-default-${type} mb-4">${message}</p>`);
    }
  }
  
  $(".search__input").keypress((e)=>{
    if(e.which === 13){
      let input = $(".search__input").val();
      if(input === ""){
        alertMessage("info","Fill the input to search for books");
      }else{
        $.getJSON(`/user/books/search/${input}`,((data)=>{
          $("#addbook").empty();
          if(data && data.error){
            alertMessage("danger",data.error);
          }else if(data){
            alertMessage();
            data.forEach((ele)=>{
              $("#addbook").append(`
              <div class="col-lg-3 col-md-4 col-sm-6" ele-id="${ele.id}">
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
                               <a id="${ele.id}" class="btn btn-default btn-default-green addtobooks">
                                   <i class="fa fa-plus-circle" aria-hidden="true"></i>
                               </a>
                           </div>
                       </div>
                   </div>
             </div>
           `);
            });
          }
        }));
      }
    }
  });

  $("#addbook").on("click",".addtobooks",function(e){
    let id = this.id;
    $.getJSON(`/user/books/add/${id}`,((data)=>{
      if(data && data.error){
        alertMessage("danger",data.error);
        console.log(data.error);
      }else if(data){
        $(`[ele-id="${id}"]`).fadeOut();
        alertMessage("success",data.message);
      }
    }));
  })

});