var users = [];
var credentials = {};
var bin;
$(document).ready(function(){
	 var socket = io.connect('http://localhost:8080');
	 socket.on('sensor', function(data){
	 	var min_distnce = 2;
	 	var elem = $('#'+data.sens+'');
	 	var perc = Math.ceil(200/data.dis);
        if(perc > 100)
        		perc = 100;
	 	 elem.animate({width: ''+perc+'%'},100);
	 	 $('.'+data.sens+'').text(perc+'%');
	 	if(perc < 40)
	 		elem.css('backgroundColor', '#35B00F');
	 	else if(perc >=40 && perc < 80)
	 		elem.css('backgroundColor', '#F57D05');
	 	else
	 		elem.css('backgroundColor', '#F50804');
	    

	 });
	 socket.on('binData', function(data){

	 	$('#binLabel').text(data[0].collectBin.label);
	 	$('#binLocation').text(data[0].collectBin.location);
	 	$('#binData tr').not('#firstrow').remove();
	 	for(x = 0; x < data.length; x++ ){
	 		var binDat = data[x];
	 		$('#binData').append('<tr><td>'+binDat.date +' @ '+ binDat.time+'</td><td>'+binDat.worker+'</td> <td>'+binDat.message+'</td><td>'+binDat.weightCollected+'</td></tr>');
	 	}
	 })
	 $('#assignUser').submit(function(){
	 	var msg = {};
	 	$.each($('#assignUser').serializeArray(), function(_, kv) {
		  msg[kv.name] = kv.value;
		});
		$('#assign').hide();
		msg.bin = bin[bin.length-1];
		msg.weight =  $('.'+msg.bin+'').text();
		var date =  new Date();
		 date = date.toString();
		msg.date = date.substr(0,15);
		msg.time = date.substr(16,5);
		socket.emit('msgsent', msg);
	 	document.getElementById("assignUser").reset();
		return false;
	 })
	 socket.on('signup', function(data){
	 	var msg = data.message;
        var color = (msg[0] == 'success' ? 'green':'red');
	 	 if(msg[0] == 'success'){
	 	 	$('#workers').append('<option>'+msg[1].username+'</option>')
	 	 	msg[0]= 'User has been registered successfully.'
	 	 	document.getElementById("userDiv").reset();
	 	 }
	 	var box = $('.alertDanger');
	 	box.text(msg[0]).css('padding','10px');
        box.css('color', color);
	 	
	 })

	//adding workers 
	users.forEach(function(user, index){
		if(index !== 0)
			$('#workers').append('<option>'+user.username+'</option>');
	})
	
    $('input').focus(function(){
	   	$('.alertDanger').text('').css('padding','0px');

    })

    //sign up
  $('#userDiv').submit(function(){
		$.each($('#userDiv').serializeArray(), function(_, kv) {
		  credentials[kv.name] = kv.value;
		});
		socket.emit('signup', credentials);
		return false;

  })


	$('.icon, .userTask, .close').click(function(){
		var clicked = $(this).attr('value');
		switch(clicked){
			case 'addUser':
				$('.icon').removeClass('active');
				$(this).addClass('active');
				$('#table').fadeOut(function(){
					$('#userDiv').fadeIn();
				});
			break;
			case 'view':
				$('.icon').removeClass('active');
				$(this).addClass('active');
				$('#userDiv').fadeOut(function(){
					$('#table').fadeIn();
				});
			break;
			case 'logout':
			  window.location.href = 'index.html'; 
			 break;
			case 'userAssign':
			    bin = $(this).attr('id');
				$('#info').hide();
				$('#assign').slideDown(100, 'linear');
			break;
			case 'tasks':
			  var tin  = $(this).attr('id');
			    tin = tin[tin.length-1];
			    socket.emit('getData', {tin: tin});
				$('#info').slideDown(100, 'linear');
				$('#assign').hide();
			break;
			case 'close':
				$('#assign, #info').fadeOut(100, 'linear');
			break;
		}
	})
});