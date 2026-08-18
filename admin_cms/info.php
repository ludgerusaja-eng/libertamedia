<?php
// libertamedia.com Headless WordPress Diagnostic Verification File
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=utf-8");

echo "<div style='font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 40px auto; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid #10b981; background: #ecfdf5;'>";
echo "<h2 style='color: #065f46; margin-top: 0;'>✅ LiteSpeed PHP Handler Active!</h2>";
echo "<p style='color: #047857; font-size: 14px;'>Subdomain <strong>admin.libertamedia.com</strong> telah terhubung dengan LiteSpeed LSPHP engine secara native tanpa terganggu Phusion Passenger Node.js.</p>";
echo "<hr style='border: 0; border-top: 1px solid #a7f3d0; margin: 20px 0;'>";
echo "<p style='font-size: 13px; color: #065f46;'>PHP Version: <strong>" . phpversion() . "</strong></p>";
echo "<p style='font-size: 13px; color: #065f46;'>Server Software: <strong>" . ($_SERVER['SERVER_SOFTWARE'] ?? 'LiteSpeed Web Server') . "</strong></p>";
echo "</div>";

phpinfo();
