const paymentReq = document.getElementById('paymentReq');
const differenceResult = document.getElementById('difference-result');
const selectedDateInput = document.getElementById('date');

$(document).ready(function(){
  $('.user-list').select2()
})


//select current date and future dates
const today = new Date();
  if (today.getFullYear() < 2024) {
    selectedDate.setAttribute('min', '2024-01-01');
  } else {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const minDate = `${year}-${month}-${day}`;
    document.getElementById('date').setAttribute('min', minDate);
  }

  selectedDateInput.addEventListener('change', function() {
    const selectedDate = new Date(selectedDateInput.value);
    const currentDate = new Date();
    if (!isNaN(selectedDate)) {
        const timeDifference = selectedDate.getTime() - currentDate.getTime();
        const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        differenceResult.textContent = `${dayDifference} days from now`;
    } else {
        differenceResult.textContent = 'Please select a valid date.';
    }
  });

// getting users from domo
const personSelect = document.getElementById('person-select');
domo.get(`/domo/users/v1?includeDetails=true&limit=200`).then(function(data){
    console.log(data[0].id)
  
    data.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.displayName;
      personSelect.appendChild(option);
    });

})

// getting current username
const currentUserNameId = domo.env.userId;
console.log(currentUserNameId)
let username;
domo.get(`/domo/users/v1/${currentUserNameId}?inculudeDetails=true`).then(function(data){
    username = data.displayName;
    console.log(username);
})

// sending payment request
paymentReq.addEventListener('click', function(){

    //const receiver_name = document.getElementById('name').value;
    const userEnteredName = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const amount = document.getElementById('amount').value;
    const rawDate = document.getElementById('date').value;
    const company = document.getElementById('company').value;
    const destination = document.getElementById('destination').value;
    const currency = document.getElementById('currency').value;
    const selectedUserId = personSelect.value;
    //console.log(selectedUserId)
    const selectedUserName = personSelect.options[personSelect.selectedIndex].text;

    // format the date
    const newDate = new Date(rawDate);
    const formatDate = (newDate) => {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return newDate.toLocaleDateString('en-US', options);
    };
    const formattedDate = formatDate(newDate);

    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
    <h1 style="font-size:15px;">Hi ${selectedUserName},</h1>
    <p >${company} ${username}, requested <span style="font-weight:bold;font-style:italic;">${amount} ${currency}</span> payment</p>
    <p>You need to make a payment before <span style="font-weight:bold; text-decoration:underline;">${formattedDate}</span></p>
    <p>Thanks, <br>${username}</p>`

    const bodyHTML = bodyEl.innerHTML;

    const startWorkflow = (alias, body) => {
      domo.post(`/domo/workflow/v1/models/${alias}/start`, body)
    }
    startWorkflow("send_email", { to: selectedUserId, sub: `Payment request from ${company} for ${selectedUserName}`, body: bodyHTML})


    const storeData = {
      "content": {
        "requested_by": {
          'name': `${username}`,
          'user_id': `${currentUserNameId}`,
        },
        requested_to:{
          'user_id': `${selectedUserId}`,
          'name': `${selectedUserName}`,
          'user_email': `${email}`
        },
        contact_details:{
          'name': `${userEnteredName}`,
          'email': `${email}`
        },
        request_details:{
          amount:{
            'currency': `${currency}`,
            'amount': `${amount}`,
            'due_date': `${formattedDate}`
          }
        },
          'company_name': `${company}`,
          'destination_account': `${destination}`
      }
    }
    console.log(storeData);
  domo.post(`/domo/datastores/v1/collections/payment_request/documents/`, storeData)
      .then((response) => {
        console.log("Payment Request Created:", response);
        alert("Payment request submitted successfully!");
  });
})
