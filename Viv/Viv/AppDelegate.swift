import UIKit
import Firebase
import CoreData
import GoogleSignIn

@UIApplicationMain

//GIDSignInDelegateはgooglelogin用
class AppDelegate: UIResponder, UIApplicationDelegate,GIDSignInDelegate,GIDSignInUIDelegate{
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        //Firebase初期化コード
        FirebaseApp.configure()
        GIDSignIn.sharedInstance().clientID = FirebaseApp.app()?.options.clientID
        GIDSignIn.sharedInstance().delegate = self
        
        return true
    }

    //googleloginプロトコル　必須入力事項
    func sign(_ signIn: GIDSignIn!, didSignInFor user: GIDGoogleUser!, withError error: Error?) {
        // ...
        if let error = error {
            /*参考　http://jesus9387.hatenablog.com/entry/2017/09/08/124052
             エラーメッセージの記述*/
            print("エラー : \(error.localizedDescription)")
            return
        }
        guard let authentication = user.authentication else { return }
        // Googleのトークンを渡し、Firebaseクレデンシャルを取得する。
        let credential = GoogleAuthProvider.credential(withIDToken: authentication.idToken,
                                                       accessToken: authentication.accessToken)
        // Firebaseにログインする。
        Auth.auth().signIn(with: credential) { (user, error) in
            if let error = error {
                // ...
                return
            }
            print("ログインしました")
            // *****TODO*****
            
            //画面遷移処理
            
            // *****TODO*****
        }

    /*このメソッドは GIDSignIn インスタンスの handleURL メソッドを呼び出します。これによって、認証プロセスの最後にアプリが受け取る URL が正しく処理されます。*/
    @available(iOS 9.0, *)
    func application(_ application: UIApplication, open url: URL, options: [UIApplicationOpenURLOptionsKey : Any])
        -> Bool {
            return GIDSignIn.sharedInstance().handle(url,sourceApplication:options[UIApplicationOpenURLOptionsKey.sourceApplication] as? String,
                                                     annotation: [:])
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }
}
}

