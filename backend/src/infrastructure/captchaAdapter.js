const svgCaptcha = require('svg-captcha');

function generarCaptcha() {
  const captcha = svgCaptcha.create({
    size: 10,
    noise: 2,                                          
    color: true,                                       
    background: '#f0ece2',                             
    width: 400,                                        
    height: 90,                                        
    fontSize: 48,                                      
    ignoreChars: '0oO1ilI',                            
    charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',    
  });

  return { svg: captcha.data, texto: captcha.text };
}

module.exports = { generarCaptcha };
