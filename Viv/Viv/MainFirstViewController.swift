import UIKit
import XLPagerTabStrip
import Firebase

class MainFirstViewController: UIViewController,IndicatorInfoProvider,UITableViewDelegate,UITableViewDataSource,UINavigationControllerDelegate{
    
    //ここがボタンのタイトルに利用されます
    var itemInfo: IndicatorInfo = "First"
    
    //IndicatorInfoProviderプロトコル必須項目
    func indicatorInfo(for pagerTabStripController: PagerTabStripViewController) -> IndicatorInfo {
        return itemInfo
    }

    //コンテンツ用配列
    var items :Dictionary = [ "username" : "HirotaNishizato","comment" : "I was born in1986"]
    
    //***** TableView *****
    //TableViewとプログラムを繋ぐ
    @IBOutlet var tableView: UITableView!
    //TableViewのデリゲート
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    //セルの数
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        //更新された分入る
        return 1
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for : indexPath)
        cell.selectionStyle = UITableViewCellSelectionStyle.none
        
        /*
        //dictに、配列itemsの中のrow番目の情報を入れる
        let dict = items[(indexPath as NSIndexPath).row]
        */
        
        //セル内コンテンツ作成
        /*
        //コンテンツ画像
        let ContentsImage = cell.viewWithTag(1) as! UIImageView
        let decodeData = (base64Encoded: dict["profileImage2"])
        let decodedData = NSData(base64Encoded: decodeData as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
        let decodedImage = UIImage(data: decodedData! as Data)
        profileImageView.image = decodedImage
        //画像を丸く表示する
        profileImageView.layer.cornerRadius = 8.0
        profileImageView.clipsToBounds = true
        */
     
        //コンテンツタイトル
        let ContentsTitleLabel = cell.viewWithTag(2) as! UILabel
        ContentsTitleLabel.text = items["username"]
        
        //コンテンツ詳細
        let ContentsTextView = cell.viewWithTag(3) as! UITextView
        ContentsTextView.text = items["comment"]

        
        return cell
    }
    //***** TableView *****
    
    

    
    override func viewDidLoad() {
        super.viewDidLoad()
}
    

    //*****FirebaseDataImport*****
    /*
    //Firebaseからデータを取得して配列(items)の中に入れる
    func loadAllData(){
        UIApplication.shared.isNetworkActivityIndicatorVisible = true
        
        let firebase  = Database.database().reference(fromURL:"https://viv-app-ce54b.firebaseio.com/").child("Posts")
        
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
   */
    //*****FirebaseDataImport*****

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
