var nodemailer = require('nodemailer');

const SendEmailUtility= async (EmailTo, EmailText, EmailSubject) => {

    let transporter = nodemailer.createTransport({
        host: 'amd55077@gmail.com',
        port: 25,
        secure: false,
        auth: {
            user: "amd55077@gmail.com",
            pass: 'paswoerd'
        },tls: {
            rejectUnauthorized: false
        },
    });


    let mailOptions = {
        from: 'User Service <info@gmail.com>',
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText
    };


    return  await transporter.sendMail(mailOptions)

}
module.exports=SendEmailUtility