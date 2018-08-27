import UIKit
import XLPagerTabStrip
import FirebaseDatabase
import Firebase

class FirstViewController: UIViewController, UIImagePickerControllerDelegate,
UITableViewDelegate,UITableViewDataSource,UINavigationControllerDelegate,IndicatorInfoProvider {
    
    //firebaseから取ってきたデータを入れる用の配列データ
    var items = [NSDictionary]()
    @IBOutlet var tableView: UITableView!
    
    //引っ張って更新
    let refreshControl = UIRefreshControl()
    
    
    //ここがボタンのタイトルに利用されます
    var itemInfo: IndicatorInfo = "First"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        //ログインしていないと、ログイン画面に飛ばされる。コード記述と、presentmodalyもつけてる
        if UserDefaults.standard.object(forKey: "check") != nil{
        }else{
            let loginViewController = self.storyboard?.instantiateViewController(withIdentifier: "login")
            self.present(loginViewController!, animated: true, completion: nil)
        }
        
        //引っ張って更新
        tableView.delegate = self
        tableView.dataSource = self
        //引っ張っている時のタイトル
        refreshControl.attributedTitle = NSAttributedString(string: "更新中")
        refreshControl.addTarget(self, action: #selector(refresh), for: UIControlEvents.valueChanged)
        tableView.addSubview(refreshControl)
    }
    
    //@objcは不要かも？上記「#selector(refresh)」のエラーコード解消のためにつけた
    @objc func refresh(){
        //データを呼んでくる
        //tableviewリロード
        
    }
    
    //tableviewのデリゲートメソッド
    func numberOfsections(in tableview: UITableView) -> Int{
        return 1
    }
    //セルの数
    func tableView(_ tableView:UITableView ,numberOfRowsInSection section:Int) -> Int{
        return 1

    }
    
    func tableView(_ tableView:UITableView ,  cellForRowAt indexpath:IndexPath) -> UITableViewCell {
        //indexpath表記がudemyと異なる
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexpath)
        
        cell.selectionStyle = UITableViewCellSelectionStyle.none
        
        //firebaseから引っ張ってきたデータを、インデックスパスrow番めに入れて下さい。
        let dict = items[(indexpath as NSIndexPath).row]
        
        //cell内紐付け
        let profileImageView = cell.viewWithTag(1) as! UIImageView
        //デコードしたデータをUIImage型へ変換して、imageviewへ反映する
        let decodeData = (base64Encoded: dict["profileImage"])
        let decodedData = NSData(base64Encoded:decodeData as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage = UIImage(data: decodedData! as Data)
        //イメージ画像を丸くする。数字が大きいほど丸に近づく。clip..が決定打
        profileImageView.layer.cornerRadius = 8.0
        profileImageView.clipsToBounds = true
        profileImageView.image = decodedImage
        
        let userNameLabel = cell.viewWithTag(2) as! UILabel
        //投稿する際に決める？決まるユーザーネームやね
        userNameLabel.text =   dict["username"] as! String
        
        let postedImageView = cell.viewWithTag(3) as! UIImageView
        //デコードしたデータをUIImage型へ変換して、imageviewへ反映する
        let decodeData2 = (base64Encoded: dict["postedImage"])
        let decodedData2 = NSData(base64Encoded:decodeData2 as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage2 = UIImage(data: decodedData2! as Data)
        postedImageView.image = decodedImage2
        
        let commnetTextView = cell.viewWithTag(4) as! UITextView
        commnetTextView.text =   dict["comment"] as? String
        
        return cell
    }

    //データベースからデータをとってきて、配列の中に入れた。
    func loadAllData(){
        //https://liviv-a23ee.firebaseio.com/
        UIApplication.shared.isNetworkActivityIndicatorVisible = true
        
        let firebase = Database.database().reference(fromURL: "https://liviv-a23ee.firebaseio.com/").child("Posts")
        
        firebase.queryLimited(toLast: 10).observe(.value){(snapsshot, error) in
            var tempItems = [NSDictionary]()
            for item in (snapsshot.children){
                let child = item as! DataSnapshot
                let dict = child.value
                tempItems.append( dict as! NSDictionary)
            }
            //最初に宣言した配列
            self.items = tempItems
            self.items = self.items.reversed()
            self.tableView.reloadData()
            //全部更新が終わったら更新マークを消す
            UIApplication.shared.isNetworkActivityIndicatorVisible = false
            }
    }
    
    func tableView(_ tableView:UITableView, didSelectRowAt indexPath: IndexPath){
        /*
     【追記必要】セルをタップした時のアクションを記載する
    */
    }
    
    func openCamera(){
        let sourceType:UIImagePickerControllerSourceType = UIImagePickerControllerSourceType.camera
        //カメラが利用可能なチェック
        if UIImagePickerController.isSourceTypeAvailable(UIImagePickerControllerSourceType.camera){
            //インスタンスの作成
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
            //インスタンスの作成
            let cameraPicker = UIImagePickerController()
            cameraPicker.sourceType = sourceType
            cameraPicker.delegate = self
            self.present(cameraPicker, animated: true, completion: nil)
        }
    }

    //カメラ表示
    @IBAction func showCamera(_ sender: Any) {
        openCamera()
    }
    
    //ライブラリー表示
    @IBAction func showPhotos(_ sender: Any) {
        openPhoto()
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
        if let pickedImage = info[UIImagePickerControllerOriginalImage] as? UIImage {
            /* backImageViewを作成して、そのimageに撮影された画像（アルバムで選択された画像）がデリゲートメソッドが呼ばれたときに、userphotoボタンがタップされた時、入っているpickedImageを代入する。*/
            
            //backImageView.image = pickedImage
        }
        /*
        //カメラ画像(アルバム画面)を閉じる処理
        imagePicker.dismiss(dismiss(animated: true, completion: nil))
        */
    }
    
    //必須
    func indicatorInfo(for pagerTabStripController: PagerTabStripViewController) -> IndicatorInfo {
        return itemInfo
    }
}
