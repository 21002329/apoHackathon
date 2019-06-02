function checkInsurence(data,avg){
        var x = document.getElementById('user_action');
        if ( avg[3] < data[3] ) {
          x.style.display = 'inline';
        } else {
          x.style.display = 'none';
        }
}


function printAccLevel(acc_level,element){
   var x = document.getElementById(element).innerHTML = "Level " + acc_level;
}
