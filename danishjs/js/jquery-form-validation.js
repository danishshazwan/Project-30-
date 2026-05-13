$(document).ready(function(){

    $('button').click(function(){

        $('input[required]').each(function(){

            if($(this).val() == ''){
                alert('Please fill all required fields');
            }

        });

    });

});