import Foundation
import Capacitor

func convertState(_ transactionState: SKPaymentTransactionState)->Int {
    var state = 0
    switch transactionState {
    case SKPaymentTransactionState.purchased, SKPaymentTransactionState.restored :
        state = 1
    case SKPaymentTransactionState.purchasing, SKPaymentTransactionState.deferred :
        state = 2
    case SKPaymentTransactionState.failed :
        state = 3
    default:
        state = 0
    }
    return state
}

@objc(Billing)
public class Billing: CAPPlugin {

    public override func load() {

    }

    // initialize(): Promise<void>;
    @objc func initialize(_ call: CAPPluginCall) {
        let rmStore = RMStore.default()!
        if RMStore.canMakePayments() {
            call.success()
        }
        else {
            call.error("Payments are not available")
        }
    }

    // purchase(options: PurchaseOptions): Promise<PurchaseResult>;
    @objc func purchase(_ call: CAPPluginCall) {
        //let subscribe = call.getBool("subscribe", false)
        let productId = call.getString("sku")
        if productId == nil {
            call.error("invalid argument: sku")
            return
        }
        let rmStore = RMStore.default()!

        rmStore.addPayment("remove_ads",
                           success:{ transaction in
                            let receiptURL = Bundle.main.appStoreReceiptURL

                            var encReceipt = ""
                            do {
                                if receiptURL != nil {
                                    encReceipt = try NSData(contentsOf: receiptURL!).base64EncodedString()
                                }
                            }
                            catch{}

                            call.success([
                                "receipt": encReceipt,
                                "orderId": transaction!.transactionIdentifier!,
                                "purchaseState": 1
                            ]);
        },
                           failure:{transaction, error in
                            call.reject(error?.localizedDescription ?? "Purchase Failed", String(error?._code ?? 0), error)
                            //@"errorCode": NILABLE([NSNumber numberWithInteger:error.code]),
                            //@"errorMessage": NILABLE(error.localizedDescription)
        })
    }

    // consumePurchase(options: ConsumePurchaseOptions): Promise<ConsumePurchaseResult>;
    @objc func consumePurchase(_ call: CAPPluginCall) {
        // TODO:
        call.success()
    }

    // getSkuDetails(options: SkuDetailsOptions): Promise<SkuDetailsResult>;
    @objc func getSkuDetails(_ call: CAPPluginCall) {
        let skus = call.getArray("skus", String.self, [])!
        RMStore.default()!.requestProducts(
            Set.init(skus),
            success: {products, invalidProductIdentifiers in

          var validProducts = [Dictionary<String,Any>]()
          for product in products! {
            let skProduct = product as! SKProduct
              let numberFormatter = NumberFormatter()
            numberFormatter.formatterBehavior = NumberFormatter.Behavior.behavior10_4
            numberFormatter.numberStyle = NumberFormatter.Style.currency
            numberFormatter.locale = skProduct.priceLocale
            let currencyCode = numberFormatter.currencyCode

            validProducts.append([
                "productId":skProduct.productIdentifier,
                "title": skProduct.localizedTitle,
                "description": skProduct.localizedDescription,
                "priceAsDecimal": skProduct.price,
                "price": RMStore.localizedPrice(of: skProduct) ?? "",
                "currency": currencyCode ?? ""
            ])
          }
                call.success([
                "list": validProducts,
                "invalidProductsIds": invalidProductIdentifiers ?? []
                ])
        },
            failure: {error in call.error("getSkuDetails failed", error)}
        )
    }

    // restorePurchases(): Promise<RestorePurchasesResult>;
    @objc func restorePurchases(_ call: CAPPluginCall) {

        RMStore.default()!.restoreTransactions(
            onSuccess:{transactions in
                var validTransactions = [Dictionary<String, Any>]()
                let formatter = DateFormatter()

                formatter.locale = Locale(identifier: "en_US_POSIX")
                formatter.timeZone = TimeZone(secondsFromGMT: 0)
                formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'";
                for transaction in transactions! {
                    let skTransaction = transaction as! SKPaymentTransaction
                    let transactionDateString = formatter.string(from: skTransaction.transactionDate!)

                    validTransactions.append([
                        "orderId": skTransaction.transactionIdentifier!,
                        "productId": skTransaction.payment.productIdentifier,
                        "purchaseTime": transactionDateString,
                        "purchaseState": convertState(skTransaction.transactionState)
                    ])
                }
                call.success([
                    "purchases": validTransactions
                ])
        },
            failure:{error in
                call.error("restore purchases failed", error)
                // @"errorCode": NILABLE([NSNumber numberWithInteger:error.code]),
        }
        )
    }
}
