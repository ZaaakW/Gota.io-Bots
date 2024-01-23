from pypasser import reCaptchaV3

reCaptcha_response = reCaptchaV3('https://google.com/recaptcha/api2/anchor?ar=1&k=6LcycFwUAAAAANrun52k-J1_eNnF9zeLvgfJZSY3&co=aHR0cHM6Ly9nb3RhLmlvOjQ0Mw..&hl=ru&v=Nh10qRQB5k2ucc5SCBLAQ4nA&size=invisible&cb=ymh6hf4qqvqq')
print(reCaptcha_response)