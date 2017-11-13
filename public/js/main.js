$("document").ready(function(){

  //BOOKS NAVIGATION
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

  $(".search__input").keypress((e)=>{
    if(e.which === 13){
      let input = $(".search__input").val();
      if(input === ""){
        console.log("please fill the form");
      }else{
        $.getJSON(`/user/books/search/${input}`,((data)=>{
          if(data && data.error){
            console.log(data.error);
          }else if(data){
            data.forEach((ele)=>{
              $("#addbook").append(`
              <div class="col-lg-3 col-md-4 col-sm-6">
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
});