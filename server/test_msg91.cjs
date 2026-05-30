const axios = require('axios').default;

async function testOtp() {
  const options = {
    method: 'POST',
    url: 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    headers: {
        'Content-Type': 'application/json',
        'authkey': '516215A1g9p5cSVcM6a1ae0e5P1'
    },
    data: {
        "integrated_number": "15559919943",
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": "otp",
                "language": {
                    "code": "en",
                    "policy": "deterministic"
                },
                "namespace": "24b8b902_4d4e_4da1_86f9_5160683abccb",
                "to_and_components": [
                    {
                        "to": [
                            "916205170591"
                        ],
                        "components": {
                            "body_1": {
                                "type": "text",
                                "value": "987654"
                            },
                            "button_1": {
                                "subtype": "url",
                                "type": "text",
                                "value": "987654"
                            }
                        }
                    }
                ]
            }
        }
    }
  };

  try {
    const { data } = await axios.request(options);
    console.log("Success Response:", data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

testOtp();
