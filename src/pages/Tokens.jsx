import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Zap, CheckCircle, QrCode, Wallet, Loader2, Gift, ExternalLink, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const PROMPTPAY_NUMBER = "0812345678";
const TRUEWALLET_LINK = "https://gift.truemoney.com/campaign/?v=XXXXXXXXXX";

const tokenPackages = [
  {
    tokens: 200,
    price: 49,
    label: "Starter",
    perToken: "0.24",
    popular: false,
    color: "from-blue-500 to-blue-600",
    bgLight: "from-blue-50 to-blue-100",
    border: "border-blue-200",
  },
  {
    tokens: 450,
    price: 99,
    label: "Popular",
    perToken: "0.22",
    popular: true,
    color: "from-primary to-accent",
    bgLight: "from-violet-50 to-sky-50",
    border: "border-primary",
  },
  {
    tokens: 750,
    price: 179,
    label: "Best Value",
    perToken: "0.24",
    popular: false,
    color: "from-emerald-500 to-green-600",
    bgLight: "from-emerald-50 to-green-50",
    border: "border-emerald-200",
  },
];

const premiumPrice = 109;

function getPromptPayQR(phone, amount) {
  return `https://promptpay.io/${phone.replace(/-/g, "")}/${amount}.png`;
}

function CountdownClose({ seconds, onClose }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
      <span>ปิดอัตโนมัติใน</span>
      <span className="font-bold text-primary">{left}s</span>
    </div>
  );
}

export default function Tokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isPremiumPurchase, setIsPremiumPurchase] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    setIsPremiumPurchase(false);
    setPaid(false);
    setShowPayment(true);
  };

  const handlePremium = () => {
    setSelectedPackage({ tokens: 200, price: premiumPrice, label: "AI Pro" });
    setIsPremiumPurchase(true);
    setPaid(false);
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    setProcessing(true);
    await base44.entities.Transaction.create({
      type: isPremiumPurchase ? "premium_upgrade" : "token_purchase",
      amount: selectedPackage.price,
      tokens_added: selectedPackage.tokens,
      payment_method: paymentMethod,
      status: "completed",
      reference_id: `TXN-${Date.now()}`,
    });
    const updateData = { tokens: (user?.tokens ?? 0) + selectedPackage.tokens };
    if (isPremiumPurchase) updateData.is_premium = true;
    await base44.auth.updateMe(updateData);
    setProcessing(false);
    setPaid(true);
  };

  const closeDialog = () => {
    setShowPayment(false);
    setPaid(false);
    if (paid) window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 border-0 shadow-xl bg-gradient-to-br from-primary via-primary/90 to-accent text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-64 h-64 rounded-full bg-white absolute -top-20 -right-20" />
            <div className="w-40 h-40 rounded-full bg-white absolute -bottom-10 -left-10" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">Token คงเหลือ</p>
              <p className="text-5xl font-display font-black">{user?.tokens ?? 0}</p>
              <p className="text-sm opacity-75 mt-1">Tokens</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                <Zap className="w-8 h-8" />
              </div>
              {user?.is_premium && (
                <Badge className="bg-amber-400 text-amber-900 text-xs">
                  <Crown className="w-3 h-3 mr-1" /> PRO
                </Badge>
              )}
              {!user?.is_premium && (
                <Button onClick={handlePremium} size="sm" variant="outline" className="border-amber-400/40 text-amber-200 hover:bg-white/10 text-xs h-7">
                  <Crown className="w-3 h-3 mr-1" /> AI Pro
                </Button>
              )}
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center text-xs">
            <div><p className="opacity-60">ฝึกข้อสอบ</p><p className="font-bold">10/ข้อ</p></div>
            <div><p className="opacity-60">Quiz Battle</p><p className="font-bold">5 Tokens</p></div>
            <div><p className="opacity-60">Tournament</p><p className="font-bold">10 Tokens</p></div>
          </div>
        </Card>
      </motion.div>

      {/* ========== TOKEN PACKAGES ========== */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-4">แพ็คเกจ Token</h2>
        <div className="grid grid-cols-1 gap-4">
          {tokenPackages.map((pkg, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`p-5 border-2 ${pkg.border} shadow-sm hover:shadow-lg transition-all relative overflow-hidden ${pkg.popular ? "ring-2 ring-primary/30" : ""}`}>
                {pkg.popular && (
                  <div className={`absolute top-0 right-0 bg-gradient-to-bl ${pkg.color} text-white text-xs font-bold px-3 py-1 rounded-bl-xl`}>
                    ยอดนิยม
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-md`}>
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-black">{pkg.tokens} <span className="text-base font-normal text-muted-foreground">Tokens</span></p>
                      <p className="text-xs text-muted-foreground">≈ {pkg.perToken} บาท/Token</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-bold">฿{pkg.price}</p>
                    <Button onClick={() => handlePurchase(pkg)} size="sm"
                      className={`mt-1 bg-gradient-to-r ${pkg.color} text-white border-0 shadow`}>
                      ซื้อเลย
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {paid ? "✅ ชำระเงินสำเร็จ!" : isPremiumPurchase ? "อัปเกรด AI Pro" : "ชำระเงิน"}
            </DialogTitle>
          </DialogHeader>

          {paid ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-heading font-bold text-lg">+{selectedPackage?.tokens} Tokens</p>
              {isPremiumPurchase && <p className="text-sm text-amber-600">🎉 ยินดีด้วย! คุณเป็น AI Pro แล้ว</p>}
              <p className="text-sm text-muted-foreground">เพิ่ม Token เรียบร้อยแล้ว</p>
              <CountdownClose seconds={3} onClose={closeDialog} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground">{isPremiumPurchase ? "AI Pro + 200 Tokens" : `${selectedPackage?.tokens} Tokens`}</p>
                <p className="text-4xl font-display font-black mt-1">฿{selectedPackage?.price}</p>
              </div>

              <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                <TabsList className="w-full">
                  <TabsTrigger value="promptpay" className="flex-1">
                    <QrCode className="w-4 h-4 mr-1.5" /> PromptPay
                  </TabsTrigger>
                  <TabsTrigger value="truewallet" className="flex-1">
                    <Wallet className="w-4 h-4 mr-1.5" /> True Wallet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="promptpay">
                  <div className="text-center space-y-3 pt-2">
                    <div className="w-52 h-52 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20 shadow-inner bg-white">
                      <img
                        src={getPromptPayQR(PROMPTPAY_NUMBER, selectedPackage?.price ?? 0)}
                        alt="PromptPay QR"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { e.target.src = ""; e.target.parentElement.innerHTML = `<div class='flex flex-col items-center justify-center h-full text-muted-foreground'><svg class='w-12 h-12 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'/></svg><p class='text-xs'>PromptPay: ${PROMPTPAY_NUMBER}</p><p class='text-xs'>฿${selectedPackage?.price ?? 0}</p></div>`; }}
                      />
                    </div>
                    <p className="text-sm font-medium">สแกน QR เพื่อชำระ ฿{selectedPackage?.price}</p>
                    <p className="text-xs text-muted-foreground">พร้อมเพย์: {PROMPTPAY_NUMBER}</p>
                  </div>
                </TabsContent>

                <TabsContent value="truewallet">
                  <div className="text-center space-y-3 pt-2">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-lg font-bold">True Wallet ซอง</p>
                    <p className="text-sm text-muted-foreground">ส่งซองอั่งเปาจำนวน <span className="font-bold text-foreground">฿{selectedPackage?.price}</span></p>
                    <a href={TRUEWALLET_LINK} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white gap-2">
                        <ExternalLink className="w-4 h-4" />
                        เปิดลิงก์ True Wallet
                      </Button>
                    </a>
                    <p className="text-xs text-muted-foreground">หลังส่งซองแล้ว กดยืนยันด้านล่าง</p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={confirmPayment} disabled={processing} className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white shadow-lg">
                {processing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังดำเนินการ...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" /> ฉันชำระเงินแล้ว</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}