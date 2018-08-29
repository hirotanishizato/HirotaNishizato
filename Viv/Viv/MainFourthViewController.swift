import UIKit
import XLPagerTabStrip

class MainFourthViewController: UIViewController,IndicatorInfoProvider {
    
    //ここがボタンのタイトルに利用されます
    var itemInfo: IndicatorInfo = "Fourth"
    
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
