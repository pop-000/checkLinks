async function loadPage(src){
    
    let url = window.location.protocol + "//" + window.location.hostname + "/checkSiteLinks/ajax_handler.php";
    url += "?src=" + encodeURI(src);
    url += "&action=get_page";

    let page = {}

    let response = await fetch(url);
    if (response.ok) { 
        let json = await response.json();
        if(json.result){
            page = {
                result: true,
                data: json.data
            }
        } else {
            page = {
                result: false,
                error: "Ошибка обработки"
            };
        }
    } else {
        page = {
            result: false,
            error: "Ошибка HTTP: " + response.error
        };
    }

    return page; 
}
    
class ExamingPage extends React.Component{

    getLinkList(links){

        if(!links) return false;

        const result = "";
        ['local', 'outer'].forEach(type => {
            if(links.type && links.type.length > 0) {
                let i = 0;
                const linkList = links.type.map((link) =>
                    React.createElement("li", {
                        key: "l" + i++
                    }, link)
                );
                result += React.createElement("ul", {className: `links-` + type}, linkList);  
            }
        });

        return React.createElement("div", null, {result});
    }

    render() {
        const { error, isLoaded, data } = this.props;
        let msg = "Ожидание";
        let status = "status";
        if (error) {
            msg = "Ошибка: " + error;
            status += " error";
        } else if (!isLoaded) {
            status += " await";
            msg = `Введите адрес сайта`;
        } else if(data){
            msg = `Результат`;
            status += " done";
        }
        return (
            React.createElement("div", null, 
                React.createElement("div", {
                    className: status
                    }, msg), 
                React.createElement("div", {
                    className: "result"
                    }, this.getLinkList(data))
            )
        );
    }
}

class SiteAddressForm extends React.Component{
    constructor(props) {
        super(props);
        this.state = {value: ''};

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    
    handleSubmit(event) {
        event.preventDefault();
        this.props.onUrlSet(this.state.value);
    }
	
	handleChange(event) {
        this.setState ({value: event.target.value});
    }
    
    render() {
        return (
            React.createElement("form", {
                onSubmit: this.handleSubmit,
                className: "formAddress"
                }, 
                React.createElement("label", null, "Адрес сайта:",
                    React.createElement("input", {
                        type: "text",
                        value: this.state.value,
                        onChange: this.handleChange
                    })),
                    React.createElement("input", {
                        type: "submit",
                        value: "Проверить"
                    })
            )
        );
    }
}

class BlockExamine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            data: null,
            url: null
        };

        this.handleUrlSet = this.handleUrlSet.bind(this);
    }

    handleUrlSet(url) {
       
        if(url.length < 5) return false;     
        if(url === this.state.url) return false;
        
        // const page = getPage(url);     
        const page = loadPage(url);     
        console.log("page: " + JSON.stringify(page));

        if(page.result){
            this.setState({
                data: page.data
            });
        } else {
            this.setState({
                error: page.error
            });
        }
        this.setState({
            isLoaded: true,
            url: url
        });

    }

    render() {

        return (
            React.createElement("div", null, 
                React.createElement("header", {
                    className: "App-header"
                    },
                    React.createElement("img", {
                        src: './logo.svg',
                        alt: "logo",
                        className: "App-logo"
                    }),
                    React.createElement("h1", null, "Проверка ссылок сайта"), 
                    React.createElement("div", null, 
                        React.createElement(SiteAddressForm, {
                            onUrlSet: this.handleUrlSet
                        }))
                ),
                React.createElement("section", {
                    className: "result"
                    }, 
                    React.createElement(ExamingPage, {
                        error: this.state.error,
                        isLoaded: this.state.isLoaded,
                        data: this.state.data
                    })
                )
            )
        );   
    }
}

ReactDOM.render(
    React.createElement(BlockExamine, {
        id: "App",
        className: "App"
    }),
    document.getElementById('root')
);