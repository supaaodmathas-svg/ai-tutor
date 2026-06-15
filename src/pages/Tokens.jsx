import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Zap, Crown, CheckCircle, QrCode, Wallet, Loader2, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const tokenPackages = [
  { tokens: 50, price: 29, label: "Starter", popular: false },
  { tokens: 150, price: 79, label: "Popular", popular: true },
  { tokens: 500, price: 199, label: "Best Value", popular: false },
];

const premiumPrice = 299;

export default function Tokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isPremiumPurchase, setIsPremiumPurchase] = useState(false);

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    setIsPremiumPurchase(false);
    setShowPayment(true);
  };

  const handlePremium = () => {
    setSelectedPackage({ tokens: 200, price: premiumPrice, label: "Premium" });
    setIsPremiumPurchase(true);
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    setProcessing(true);
    // สร้าง transaction record
    await base44.entities.Transaction.create({
      type: isPremiumPurchase ? "premium_upgrade" : "token_purchase",
      amount: selectedPackage.price,
      tokens_added: selectedPackage.tokens,
      payment_method: paymentMethod,
      status: "completed",
      reference_id: `TXN-${Date.now()}`,
    });

    // อัปเดต user
    const updateData = {
      tokens: (user?.tokens ?? 50) + selectedPackage.tokens,
    };
    if (isPremiumPurchase) {
      updateData.is_premium = true;
    }
    await base44.auth.updateMe(updateData);

    setProcessing(false);
    setShowPayment(false);
    toast({
      title: isPremiumPurchase ? "🎉 อัปเกรด Premium สำเร็จ!" : "✅ เติม Token สำเร็จ!",
      description: `ได้รับ ${selectedPackage.tokens} Tokens`,
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">เติม Token</h1>
            <p className="text-sm text-muted-foreground">Token คงเหลือ: {user?.tokens ?? 50}</p>
          </div>
        </div>
      </motion.div>

      {/* Current Balance */}
      <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Token คงเหลือ</p>
            <p className="text-4xl font-display font-bold mt-1">{user?.tokens ?? 50}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Zap className="w-8 h-8" />
          </div>
        </div>
        {user?.is_premium && (
          <Badge className="mt-3 bg-amber-400 text-amber-900">
            <Crown className="w-3 h-3 mr-1" /> Premium Active
          </Badge>
        )}
      </Card>

      {/* Premium Card */}
      {!user?.is_premium && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 border-2 border-amber-300 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-display font-bold text-amber-900">AI Tutor Pro</h2>
              </div>
              <p className="text-sm text-amber-700 mb-4">อัปเกรดเพื่อรับสิทธิพิเศษ</p>
              <ul className="space-y-2 mb-4">
                {["ได้รับ 200 Tokens ทันที", "ข้อสอบระดับสูงพิเศษ", "วิเคราะห์ผลละเอียด", "ไม่มีโฆษณา"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-800">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-display font-bold text-amber-900">฿{premiumPrice}<span className="text-sm font-normal">/เดือน</span></p>
                <Button onClick={handlePremium} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  อัปเกรดเลย
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Token Packages */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-4">แพ็คเกจ Token</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tokenPackages.map((pkg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`p-6 border-0 shadow-md relative ${pkg.popular ? "ring-2 ring-primary" : ""}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">ยอดนิยม</Badge>
                )}
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Zap className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-3xl font-display font-bold">{pkg.tokens}</p>
                  <p className="text-sm text-muted-foreground mb-4">Tokens</p>
                  <p className="text-2xl font-bold mb-4">฿{pkg.price}</p>
                  <Button onClick={() => handlePurchase(pkg)} className="w-full" variant={pkg.popular ? "default" : "outline"}>
                    ซื้อเลย
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isPremiumPurchase ? "อัปเกรด Premium" : "ชำระเงิน"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground">{isPremiumPurchase ? "Premium + 200 Tokens" : `${selectedPackage?.tokens} Tokens`}</p>
              <p className="text-3xl font-display font-bold mt-1">฿{selectedPackage?.price}</p>
            </div>

            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="w-full">
                <TabsTrigger value="promptpay" className="flex-1">
                  <QrCode className="w-4 h-4 mr-2" /> PromptPay
                </TabsTrigger>
                <TabsTrigger value="truewallet" className="flex-1">
                  <Wallet className="w-4 h-4 mr-2" /> True Wallet
                </TabsTrigger>
              </TabsList>
              <TabsContent value="promptpay">
                <Card className="p-6 border-0 bg-secondary/30 text-center">
                  <div className="w-48 h-48 mx-auto bg-white rounded-xl border-2 border-dashed border-border flex items-center justify-center mb-3">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">PromptPay QR Code</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">สแกน QR Code เพื่อชำระเงิน</p>
                  <p className="text-xs text-muted-foreground mt-1">จำนวน ฿{selectedPackage?.price}</p>
                </Card>
              </TabsContent>
              <TabsContent value="truewallet">
                <Card className="p-6 border-0 bg-secondary/30 text-center">
                  <div className="w-20 h-20 mx-auto bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
                    <Gift className="w-10 h-10 text-orange-500" />
                  </div>
                  <p className="text-lg font-bold mb-1">True Wallet ซอง</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    ส่งซองอังเปาจำนวน ฿{selectedPackage?.price}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ส่งซองมาที่ลิงก์ด้านล่าง แล้วกดยืนยัน
                  </p>
                </Card>
              </TabsContent>
            </Tabs>

            <Button onClick={confirmPayment} disabled={processing} className="w-full bg-gradient-to-r from-primary to-accent">
              {processing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังดำเนินการ...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> ยืนยันการชำระเงิน</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}