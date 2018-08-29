import UIKit
import XLPagerTabStrip

class MainSecondViewController: UIViewController,IndicatorInfoProvider {
    
    //ここがボタンのタイトルに利用されます
    var itemInfo: IndicatorInfo = "Second"
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    //IndicatorInfoProviderプロトコル必須項目
    func indicatorInfo(for pagerTabStripController: PagerTabStripViewController) -> IndicatorInfo {
        return itemInfo
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
