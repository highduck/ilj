package highduck.capacitor.billing;

public class Constants {
  // IAB Helper error codes
  //
  // KEEP SYNCHRONIZED with src/js/constants.js
  //
  public static final int ERROR_CODES_BASE = 6777000;

  public static final int ERR_SETUP = ERROR_CODES_BASE + 1;
  public static final int ERR_LOAD = ERROR_CODES_BASE + 2;
  public static final int ERR_PURCHASE = ERROR_CODES_BASE + 3;
  public static final int ERR_CANCELLED = ERROR_CODES_BASE + 6;
  public static final int ERR_UNKNOWN = ERROR_CODES_BASE + 10;
  public static final int ERR_FINISH = ERROR_CODES_BASE + 13;
  public static final int ERR_COMMUNICATION = ERROR_CODES_BASE + 14;
  public static final int ERR_SUBSCRIPTIONS_NOT_AVAILABLE = ERROR_CODES_BASE + 15;
  public static final int ERR_MISSING_TOKEN = ERROR_CODES_BASE + 16;
  public static final int ERR_VERIFICATION_FAILED = ERROR_CODES_BASE + 17;
  public static final int ERR_BAD_RESPONSE = ERROR_CODES_BASE + 18;
  public static final int ERR_REFRESH = ERROR_CODES_BASE + 19;
  public static final int ERR_PAYMENT_EXPIRED = ERROR_CODES_BASE + 20;
  public static final int ERR_DOWNLOAD = ERROR_CODES_BASE + 21;
  public static final int ERR_SUBSCRIPTION_UPDATE_NOT_AVAILABLE = ERROR_CODES_BASE + 22;


  public static final int OK = 0;
  public static final int INVALID_ARGUMENTS = -1;
  public static final int UNABLE_TO_INITIALIZE = -2;
  public static final int BILLING_NOT_INITIALIZED = -3;
  public static final int UNKNOWN_ERROR = -4;
  public static final int USER_CANCELLED = -5;
  public static final int BAD_RESPONSE_FROM_SERVER = -6;
  public static final int VERIFICATION_FAILED = -7;
  public static final int ITEM_UNAVAILABLE = -8;
  public static final int ITEM_ALREADY_OWNED = -9;
  public static final int ITEM_NOT_OWNED = -10;
  public static final int CONSUME_FAILED = -11;

  public static final int PURCHASE_PURCHASED = 0;
  public static final int PURCHASE_CANCELLED = 1;
  public static final int PURCHASE_REFUNDED = 2;

}
