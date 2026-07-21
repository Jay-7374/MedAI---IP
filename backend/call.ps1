$body = @{
    to = "+919391279121"
    bot_name = "PostDischargeCheckIn"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:8000/api/calls/outbound" -Method POST -ContentType "application/json" -Body $body
$result | ConvertTo-Json
