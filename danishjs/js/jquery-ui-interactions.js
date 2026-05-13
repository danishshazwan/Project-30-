$(document).ready(function(){

    $('.tab').click(function(){
        $('.tab').removeClass('active');
        $(this).addClass('active');
    });

    $('.modal-btn').click(function(){
        $('.modal-overlay').fadeIn();
    });

    $('.close-modal').click(function(){
        $('.modal-overlay').fadeOut();
    });

});