$(function(){

    $('.about').on('click', () => {
        $('body, html').animate({
            scrollTop: $('.about-container').offset().top - 70
        }, 800);
    });

    $('.news').on('click', () => {
        $('body, html').animate({
            scrollTop: $('.news-container').offset().top - 70
        }, 800);
    });

    $('.contact').on('click', () => {
        $('body, html').animate({
            scrollTop: $('.contact-container').offset().top - 70
        }, 800);
    });

    $('.landing-container').on('click', () => {
        $('.navbar-collapse').collapse('hide')
    })

});