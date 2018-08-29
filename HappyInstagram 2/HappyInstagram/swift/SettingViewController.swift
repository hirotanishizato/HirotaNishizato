import UIKit
import Firebase

class SettingViewController: UIViewController,UITextFieldDelegate,UIImagePickerControllerDelegate,UINavigationControllerDelegate {

    @IBOutlet var userNameTextField: UITextField!
    @IBOutlet var profileImageView: UIImageView!
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        userNameTextField.delegate = self
    }

    func openCamera(){
        let sourceType:UIImagePickerControllerSourceType = UIImagePickerControllerSourceType.camera
        //カメラが利用可能なチェック
        if UIImagePickerController.isSourceTypeAvailable(UIImagePickerControllerSourceType.camera){
            let cameraPicker = UIImagePickerController()
            cameraPicker.sourceType = sourceType
            cameraPicker.delegate = self
            self.present(cameraPicker, animated: true, completion: nil)
        }
    }
    
    func openPhoto(){
        let sourceType:UIImagePickerControllerSourceType = UIImagePickerControllerSourceType.photoLibrary
        //カメラが利用可能なチェック
        if UIImagePickerController.isSourceTypeAvailable(UIImagePickerControllerSourceType.photoLibrary){
            let cameraPicker = UIImagePickerController()
            cameraPicker.sourceType = sourceType
            cameraPicker.delegate = self
            self.present(cameraPicker, animated: true, completion: nil)
        }
    }
    
    @IBAction func back(_ sender: Any) {
        dismiss (animated: true, completion: nil)
    }
    
    @IBAction func done(_ sender: Any) {
        //初期化
        var data: NSData = NSData()
        if let image = profileImageView.image{
            data = UIImageJPEGRepresentation(image, 0.1)! as NSData
        }
        let userName = userNameTextField.text
        let base64String = data.base64EncodedString(options:     NSData.Base64EncodingOptions.lineLength64Characters)
        as String
        //アプリ内へ保存する
        UserDefaults.standard.set(userName, forKey: "username")
        UserDefaults.standard.set(base64String, forKey: "profileImage")
        //画面を閉じる
        dismiss(animated: true, completion: nil)
    }
    
    @IBAction func changeProfile(_ sender: Any) {
        //カメラ起動か、ライブラリからの選択のアラート表示(.actionSheet)
        let alertViewController = UIAlertController(title: "選択して下さい", message: "(空欄)", preferredStyle:  .actionSheet)
        let cameraAction = UIAlertAction(title: "カメラ", style: .default, handler: { (action:UIAlertAction!) -> Void in
            //処理を書く
             self.openCamera()
            })
        let photosAction = UIAlertAction(title: "アルバム", style: .default, handler:{
            (action:UIAlertAction!) -> Void in
            self.openPhoto()
        })
        
        let cancelAction = UIAlertAction(title: "キャンセル", style: .cancel, handler: nil)
        
        alertViewController.addAction(cameraAction)
        alertViewController.addAction(photosAction)
        alertViewController.addAction(cancelAction)
        //OKアクションをモーダルで出す
        present(alertViewController, animated: true, completion: nil)
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : AnyObject]) {
        if let pickedImage = info[UIImagePickerControllerOriginalImage] as? UIImage{
            //画像の大きさを合わせる
            profileImageView.contentMode = .scaleToFill
            //画像を受け取る
            profileImageView.image = pickedImage
        }
        //カメラ（アルバム画面）を閉じる処理
        picker.dismiss(animated: true, completion: nil)
    }
    
    
    @IBAction func logout(_ sender: Any) {
        try! Auth.auth().signOut()
        //ログアウトしたことを記録する
        //キー値checkを消す
        UserDefaults.standard.removeObject(forKey: "check")
        dismiss(animated: true, completion: nil)
    }
    
    //キーボードを枠外タッチで下げる
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        if(userNameTextField.isFirstResponder){
            userNameTextField.resignFirstResponder()
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
