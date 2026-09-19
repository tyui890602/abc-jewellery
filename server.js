const express=require("express");
const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY);
const app=express();
app.use(express.json());

app.get("/",function(req,res){
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Card Payment</title>
<style>
body{font-family:Arial;background:#eee;padding:20px;text-align:center}
.box{background:white;padding:25px;border-radius:15px}
input{font-size:28px;width:80%;padding:15px;text-align:center}
button{margin-top:20px;padding:20px;font-size:22px;width:90%}
</style>
<script src="https://js.stripe.com/v3/"></script>
</head>
<body>
<div class="box">
<h1>Plată cu cardul</h1>
<h2>Introdu suma</h2>
<input id="amount" type="number" step="0.01" placeholder="£0.00"><button onclick="pay()">💳 CONTINUĂ LA PLATĂ</button>
<div id="payment-element"></div>
<button id="confirm-payment" onclick="confirmPayment()" style="display:none">✅ CONFIRMĂ PLATA</button>
</div>

<script>
let stripeInstance,elementsInstance;
async function pay(){
const amount=document.getElementById("amount").value;
if(!amount || Number(amount)<=0){alert("Introdu o sumă.");return;}
const config=await fetch("/stripe-config").then(r=>r.json());
stripeInstance=Stripe(config.publishableKey);
const data=await fetch("/create-payment-intent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:Number(amount)})}).then(r=>r.json());
elementsInstance=stripeInstance.elements({clientSecret:data.clientSecret});
const paymentElement=elementsInstance.create("payment");
paymentElement.mount("#payment-element");
document.getElementById("confirm-payment").style.display="block";
}
async function confirmPayment(){
const result=await stripeInstance.confirmPayment({elements:elementsInstance,redirect:"if_required"});
if(result.error){alert(result.error.message);return;}
alert("Plată reușită!");
}
</script>
</body>
</html>
`);
});
app.get("/stripe-config",(req,res)=>res.json({publishableKey:process.env.STRIPE_PUBLISHABLE_KEY}));


app.post("/create-payment-intent", async function(req,res){
try {
const amount=Number(req.body.amount);
if(!Number.isFinite(amount) || amount<=0) return res.status(400).json({error:"Suma invalida"});
if(amount>100000) return res.status(400).json({error:"Suma prea mare"});
const amountPence=Math.round(amount*100);
const paymentIntent=await stripe.paymentIntents.create({amount:amountPence,currency:"gbp"});
res.json({clientSecret:paymentIntent.client_secret});
} catch(error) { console.error(error.message); return res.status(500).json({error:"Eroare la procesarea platii"}); }
});


app.listen(3000,"0.0.0.0",function(){
console.log("Manual POS pornit!");
});