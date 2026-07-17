import { Divider } from '@mui/material'

export const toolTipData = {
  loginBonus: {
    title: 'Login Bonus',
    tooltip: 'Coins rewarded to users upon daily login.'
  },
  durationOfShorts: {
    title: 'Shorts Duration',
    tooltip: 'Maximum duration (in seconds) for short videos.'
  },
  pkEndTime: {
    title: 'PK End Time',
    tooltip: 'Time limit (in minutes) for PK battles.'
  },
  minCoinsToCashOut: {
    title: 'Minimum Coins to Cash Out',
    tooltip: 'Minimum coins a user needs to withdraw as cash.'
  },
  minCoinsForPayout: {
    title: 'Minimum Coins for Payout',
    tooltip: 'Minimum coins required for a payout request.'
  },
  userPrivacyPolicyUrl: {
    title: 'User Privacy Policy URL',
    tooltip: 'Link to privacy policy for app users.'
  },
  listenerPrivacyPolicyUrl: {
    title: 'Listener Privacy Policy URL',
    tooltip: 'Link to privacy policy for listeners.'
  },
  aboutUsUrl: {
    title: 'About Us URL',
    tooltip: 'Link to the About Us page.'
  },
  helpdeskEmail: {
    title: 'Helpdesk Email',
    tooltip: 'Support email for user queries or issues.'
  },
  shortsEffectEnabled: {
    title: 'Shorts Effect Enabled',
    tooltip: 'Enable or disable effects for short videos.'
  },
  androidEffectLicenseKey: {
    title: 'Android Effect License Key',
    tooltip: 'License key for effects on Android devices.'
  },
  iosEffectLicenseKey: {
    title: 'iOS Effect License Key',
    tooltip: 'License key for effects on iOS devices.'
  },
  watermarkEnabled: {
    title: 'Watermark Enabled',
    tooltip: 'Enable watermark on videos or live streams.'
  },
  watermarkIcon: {
    title: 'Watermark Icon',
    tooltip: 'Icon image used as the watermark.'
  },
  zegoAppId: {
    title: 'Zego App ID',
    tooltip: 'Zego App ID for video and live streaming services.'
  },
  zegoAppSignIn: {
    title: 'Zego App Sign',
    tooltip: (
      <>
        Zego App Sign for secure connection. You can get it from Zego Console{' '}
        <a href='https://console.zegocloud.com' target='_blank' className='text-blue-500' rel='noopener noreferrer'>
          click
        </a>
        .
      </>
    )
  },
  isDummyData: {
    title: 'Use Dummy Data',
    tooltip: 'Enable dummy/demo data in the app for testing.'
  },
  videoCallRatePrivate: {
    title: 'Private Video Call Rate',
    tooltip: 'Per-minute coin cost for private video calls.'
  },
  audioCallRatePrivate: {
    title: 'Audio Call Rate',
    tooltip: 'Per-minute coin cost for audio calls.'
  },
  videoCallRateRandom: {
    title: 'Video Call Rate',
    tooltip: 'Per-minute coin cost for video calls.'
  },
  audioCallRateRandom: {
    title: 'Random Audio Call Rate',
    tooltip: 'Per-minute coin cost for random audio calls.'
  },
  dailyLoginBonusCoins: {
    title: 'Login Bonus Coins',
    tooltip: 'Fixed bonus coins for each login.'
  },
  adminCommissionPercent: {
    title: 'Admin Commission (%)',
    tooltip: 'Percentage of commission taken by admin from host income.'
  },
  AndroidAppVersion: {
    title: 'Android App Version',
    tooltip: 'The current version of the Android app available on the Play Store.'
  },
  IOSappVersion: {
    title: 'IOS app Version',
    tooltip: 'The current version of the iOS app available on the App Store.'
  },
  androidAppLink: {
    title: 'Android App Link',
    tooltip: 'Direct URL to download the Android app from the Play Store.'
  },
  iosAppLink: {
    title: 'IOS App Link',
    tooltip: 'Direct URL to download the iOS app from the App Store.'
  },
  allowBecomeHostOption: {
    title: 'Allow Become Host',
    tooltip: 'Allow users to apply or become a host.'
  },
  isApplicationLive: {
    title: 'Application Live Mode',
    tooltip: 'Flag to indicate if the app is in live mode.'
  },
  isDemoContentEnabled: {
    title: 'Demo Content Enabled',
    tooltip: 'Enable or disable showing demo content in app.'
  },
  privateKeyJson: {
    title: 'Firebase Notification Settings',
    tooltip: (
      <>
        Configure Firebase Cloud Messaging (FCM) to send push notifications.You can get the private key JSON file from
        your Firebase project settings.{' '}
        <a
          href='https://console.firebase.google.com/project'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Click
        </a>
        .
      </>
    )
  },
  privateKeyJsonLogin: {
    title: 'Firebase Notification Settings',
    tooltip: (
      <>
        Configure Firebase Cloud Messaging (FCM) to send push notifications.
        {/* <a
          href='https://console.firebase.google.com/project'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Click
        </a> */}
        <Divider sx={{ my: 1 }} />
        For detailed instructions, see: <br />
        {/* <p className="fw-semibold">Admin Panel / Setup Notification (FCM)</p> */}
        <a
          href='https://docs.codderlab.com/Talkin/#privateKey'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Admin Panel / Setup Notification (FCM)
        </a>
      </>
    )
  },

  stripePublicKey: {
    title: 'Stripe Public Key',
    tooltip: (
      <>
        Public API key for Stripe payments. Required for client-side requests.{' '}
        <a
          href='https://dashboard.stripe.com/apikeys'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from Stripe Dashboard
        </a>
        .
      </>
    )
  },
  stripeSecretKey: {
    title: 'Stripe Secret Key',
    tooltip: (
      <>
        Secret API key for Stripe server-side requests. Keep this key private.{' '}
        <a
          href='https://dashboard.stripe.com/apikeys'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Manage in Stripe Dashboard
        </a>
        .
      </>
    )
  },
  razorpayKeyId: {
    title: 'Razorpay Key ID',
    tooltip: (
      <>
        Public key used to initialize Razorpay checkout.{' '}
        <a
          href='https://dashboard.razorpay.com/app/keys'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from Razorpay Dashboard
        </a>
        .
      </>
    )
  },
  razorpayKeySecret: {
    title: 'Razorpay Key Secret',
    tooltip: (
      <>
        Secret key for Razorpay server communication. Keep it confidential.{' '}
        <a
          href='https://dashboard.razorpay.com/app/keys'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Manage in Razorpay Dashboard
        </a>
        .
      </>
    )
  },
  flutterwavePublicKey: {
    title: 'Flutterwave Public Key',
    tooltip: (
      <>
        Public API key for Flutterwave integration.{' '}
        <a
          href='https://dashboard.flutterwave.com/dashboard/settings/apis'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from Flutterwave Dashboard
        </a>
        .
      </>
    )
  },
  isStripeEnabled: {
    title: 'Enable Stripe',
    tooltip: 'Toggle to enable or disable Stripe as a payment method.'
  },
  isRazorpayEnabled: {
    title: 'Enable Razorpay',
    tooltip: 'Toggle to enable or disable Razorpay as a payment method.'
  },
  isFlutterwaveEnabled: {
    title: 'Enable Flutterwave',
    tooltip: 'Toggle to enable or disable Flutterwave as a payment method.'
  },
  isGooglePlayEnabled: {
    title: 'Enable Google Play',
    tooltip: 'Toggle to enable or disable Google Play in-app purchases.'
  },

  minimumCoinsForConversion: {
    title: 'Cash and Coin Ratio',
    tooltip: 'This is ratio for converting coins to cash. For example, if set to 100, 100 coins equal 1 cash unit.'
  },
  minimumCoinsForPayout: {
    title: 'Minimum Coins for Payout',
    tooltip: 'Minimum coin threshold required for listener to request a payout.'
  },
  agencyMinPayout: {
    title: 'Agency Minimum Payout',
    tooltip: 'Minimum payout amount required for agencies to withdraw earnings.'
  },

  isStripeIosEnabled: {
    title: 'Enable Stripe (IOS)',
    tooltip: 'Toggle to enable or disable Stripe as a payment method for iOS users.'
  },

  isRazorpayIosEnabled: {
    title: 'Enable Razorpay (IOS)',
    tooltip: 'Toggle to enable or disable Razorpay as a payment method for iOS users.'
  },

  isFlutterwaveIosEnabled: {
    title: 'Enable Flutterwave (IOS)',
    tooltip: 'Toggle to enable or disable Flutterwave as a payment method for iOS users.'
  },


  isPaystackAndroidEnabled: {
    title: 'Enable Paystack (Android)',
    tooltip: 'Toggle to enable or disable Paystack payment method for Android users.'
  },

  isPaystackIosEnabled: {
    title: 'Enable Paystack (IOS)',
    tooltip: 'Toggle to enable or disable Paystack payment method for iOS users.'
  },

  paystackPublicKey: {
    title: 'Paystack Public Key',
    tooltip: (
      <>
        Public key used to initialize Paystack checkout on client-side.{' '}
        <a
          href='https://dashboard.paystack.com/#/settings/developer'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from Paystack Dashboard
        </a>
        .
      </>
    )
  },

  paystackSecretKey: {
    title: 'Paystack Secret Key',
    tooltip: (
      <>
        Secret key used for Paystack server-side API communication. Keep it secure and do not expose it on frontend.{' '}
        <a
          href='https://dashboard.paystack.com/#/settings/developer'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Manage in Paystack Dashboard
        </a>
        .
      </>
    )
  },

  isCashfreeAndroidEnabled: {
    title: 'Enable Cashfree (Android)',
    tooltip: 'Toggle to enable or disable Cashfree payment gateway for Android users.'
  },

  isCashfreeIosEnabled: {
    title: 'Enable Cashfree (IOS)',
    tooltip: 'Toggle to enable or disable Cashfree payment gateway for iOS users.'
  },

  cashfreeClientId: {
    title: 'Cashfree Client ID',
    tooltip: (
      <>
        Client ID used to initialize Cashfree payment services.{' '}
        <a
          href='https://merchant.cashfree.com/merchants'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from Cashfree Dashboard
        </a>
        .
      </>
    )
  },

  cashfreeClientSecret: {
    title: 'Cashfree Client Secret',
    tooltip: (
      <>
        Secret key used for Cashfree server-side API communication. Keep this key confidential and never expose it on
        the frontend.{' '}
        <a
          href='https://merchant.cashfree.com/merchants'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Manage in Cashfree Dashboard
        </a>
        .
      </>
    )
  },

  isPaypalAndroidEnabled: {
    title: 'Enable PayPal (Android)',
    tooltip: 'Toggle to enable or disable PayPal payment gateway for Android users.'
  },

  isPaypalIosEnabled: {
    title: 'Enable PayPal (IOS)',
    tooltip: 'Toggle to enable or disable PayPal payment gateway for iOS users.'
  },

  paypalClientId: {
    title: 'PayPal Client ID',
    tooltip: (
      <>
        Client ID used to initialize PayPal checkout on the client side.{' '}
        <a
          href='https://developer.paypal.com/dashboard/applications/live'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Get it from PayPal Developer Dashboard
        </a>
        .
      </>
    )
  },

  paypalSecretKey: {
    title: 'PayPal Secret Key',
    tooltip: (
      <>
        Secret key used for PayPal server-side API communication. Keep this key secure and never expose it on the
        frontend.{' '}
        <a
          href='https://developer.paypal.com/dashboard/applications/live'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-500'
        >
          Manage in PayPal Developer Dashboard
        </a>
        .
      </>
    )
  }
}
