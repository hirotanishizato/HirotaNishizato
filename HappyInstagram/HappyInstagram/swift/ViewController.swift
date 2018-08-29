import UIKit
import Firebase

class ViewController: UIViewController, UIImagePickerControllerDelegate,UINavigationControllerDelegate,UITableViewDelegate,UITableViewDataSource {
   
    var items = [NSDictionary]()
    //引っ張って更新
    let refreshControl = UIRefreshControl()
    
    var passImage:UIImage = UIImage()

    //snsViewControllernに渡す用
    var nowtableViewImage = UIImage()
    var nowtableViewUserName = String()
    var nowtableViewUserImage = UIImage()
    
    //TableViewとプログラムを繋ぐ
    @IBOutlet var tableView: UITableView!
    
    //TableViewのデリゲート
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    //セルの数
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        //更新された分入る
        return items.count
    }
    //セルを作る部分
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for : indexPath)
        cell.selectionStyle = UITableViewCellSelectionStyle.none
        
        //dictに、配列itemsの中のrow番目の情報を入れる
        let dict = items[(indexPath as NSIndexPath).row]
        
        
        //セル内コンテンツ作成
        //ユーザーイメージ画像
        let profileImageView = cell.viewWithTag(1) as! UIImageView
        let decodeData = (base64Encoded: dict["profileImage2"])
        let decodedData = NSData(base64Encoded: decodeData as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage = UIImage(data: decodedData! as Data)
        profileImageView.image = decodedImage
        //画像を丸く表示する
       profileImageView.layer.cornerRadius = 8.0
       profileImageView.clipsToBounds = true
        //ユーザーネーム
        let userNameLabel = cell.viewWithTag(2) as! UILabel
        //投稿した際に指定したkey値である"username"
        userNameLabel.text = dict["username"] as! String
        
        //投稿画像
        let postedImageView = cell.viewWithTag(3) as! UIImageView
        let decodeData2 = (base64Encoded: dict["postImage"])
        let decodedData2 = NSData(base64Encoded: decodeData2 as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage2 = UIImage(data: decodedData2! as Data)
       postedImageView.image = decodedImage2

        //コメント
        let commentTextView = cell.viewWithTag(4) as! UITextView
        commentTextView.text = dict["comment"] as! String
        
        return cell
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        if UserDefaults.standard.object(forKey: "check") != nil{
        }else{
            let loginViewController = self.storyboard?.instantiateViewController(withIdentifier: "login")
            self.present(loginViewController!, animated: true, completion: nil)
        }
        
        //TableViewとdelegate,datasourceを繋いでいる
        tableView.delegate = self
        tableView.dataSource = self
        
        //引っ張って更新
        //引っ張った時のタイトル
      refreshControl.attributedTitle = NSAttributedString(string: "更新")
        refreshControl.addTarget(self, action: #selector(@objc refresh), for: UIControlEvents.valueChanged)
        //TableViewの上に乗っける
        tableView.addSubview(refreshControl)
        
        items = [NSDictionary]()
        loadAllData()
        tableView.reloadData()
    }
    
    func refresh (){
        //FireBaseからデータ読み込み
        //TableViewのリロード
        items = [NSDictionary]()
        loadAllData()
        tableView.reloadData()
        refreshControl.endRefreshing()
    }
    
    //セルをタップした時に、twitterのシェア画面い飛ばす
    func tableView(_ tableView: UITableView, didselectRowAt indexPath: IndexPath) {
        let dict = items[(indexPath as NSIndexPath).row]
        
        //エンコードして取り出す
        let decodeData = (base64Encoded:dict["profileImage"])
        let decodedData = NSData(base64Encoded: decodeData as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage = UIImage(data: decodedData! as Data)
        nowtableViewUserImage = decodedImage!

        nowtableViewUserName = (dict["username"] as? String)!
        //エンコードして取り出す
        let decodeData2 = (base64Encoded:dict["postImage"])
        let decodedData2 = NSData(base64Encoded: decodeData2 as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage2 = UIImage(data: decodedData2! as Data)
        nowtableViewImage = decodedImage2!

        //画面推移を行う
        performSegue(withIdentifier: "sns", sender: nil)
        
        
        
    }
    
    //Firebaseからデータを取得して配列(items)の中に入れる
    func loadAllData(){
        UIApplication.shared.isNetworkActivityIndicatorVisible = true
        let firebase  = Database.database().reference(fromURL: "https://happyinstagram-1bbb6.firebaseio.com/").child("Posts")
        
        firebase.queryLimited(toLast: 10).observe(.value){(snapshot,error) in
            var tempItems = [NSDictionary]()
            for item in (snapshot.children){
                let child   = item as! DataSnapshot
                let dict = child.value
                tempItems.append(dict as! NSDictionary)
            }
            //    var items = [NSDictionary]() に入れる
            self.items = tempItems
            //配列の順番を逆にする
            self.items = self.items.reversed()
            NSLog("アイテム", self.items)
            self.tableView.reloadData()
            //更新が終わったらインディケーターを見えなくする
            UIApplication.shared.isNetworkActivityIndicatorVisible = false
            
        }
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
    
    @IBAction func showcamera(_ sender: Any) {
       openCamera()
    }
    @IBAction func showphoto(_ sender: Any) {
       openPhoto()
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : AnyObject]) {
        if let pickedImage = info[UIImagePickerControllerOriginalImage] as? UIImage{
            
            //画像を受け渡し用に？新しい箱に渡す
            passImage = pickedImage
            //画面遷移
            performSegue(withIdentifier: "next", sender: nil)

        }
        //カメラ（アルバム画面）を閉じる処理
        picker.dismiss(animated: true, completion: nil)
    }
    
        //画面遷移時に受け渡す方法
    override func prepare(for segue:UIStoryboardSegue, sender:Any?){
        if(segue.identifier == "next"){
            let editVC:EditViewController = segue.destination as! EditViewController
            editVC.willEditImage = passImage
        }
        if(segue.identifier == "SNS"){
            let snsVC:SnsViewController = segue.destination as! SnsViewController
            snsVC.detailImage = nowtableViewImage
            snsVC.detailProfileImage = nowtableViewUserImage
            snsVC.detailUserName = nowtableViewUserName
        }
    }
     override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}



