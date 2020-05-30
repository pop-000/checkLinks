<?php
    function load_page($src, $body = false){
        $result = array();
        $ch = curl_init($src);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_HEADER, 1);
        if(!$body){
            curl_setopt($ch, CURLOPT_NOBODY, 1);
        }
        $response = curl_exec($ch);
        $opt = curl_getinfo($ch);
        $result["http_code"] =  $opt["http_code"];
        $result["redirect_url"] =  $opt["redirect_url"];
        curl_close($ch);

        file_put_contents("log/load_page.log", PHP_EOL . date("H:i:s d.m.Y", time()) . " : " . $src . " : " . json_encode($result), FILE_APPEND);
        if($body){
            $result["body"] = substr($response, strpos($response, "<body"));
        }

        return $result;
    }

    function get_links($src, $str){
        preg_match_all("/href=\"([^\"]+)\"/", $str, $matches);

        $url_parts = parse_url($src);
        $url_host = $url_parts["scheme"] . "://" . $url_parts["host"];
        
        $links = array();
        if(!empty($matches)){
            foreach($matches[1] as $link){
                $pos = strpos($link, "http");
                if($pos === false){
                    $links["local"][] = array("link" => $url_host . "/" . $link);
                } else {
                    if(strpos($link, $url_host) == 0){
                        $links["local"][] = array("link" => $link);
                    } else {
                        $links["outer"][] = array("link" => $link);
                    }
                }
            }
        }
        return $links;
    }

    function check_status($link){
        global $checked_links;
        $loaded = load_page($link["link"]);
        file_put_contents("log/check_status.log", $link["link"] . ":" . json_encode($loaded) . PHP_EOL, FILE_APPEND);
        $link["http_code"] =  $loaded["http_code"];
        $code = $link["http_code"];
        if($code > 199 && $code < 300){
            $link["status"] = "normal";
        }
        if($code > 299 && $code < 400){
            $link["status"] = "redirect";
            $link["redirect_url"] =  $loaded["redirect_url"];
        }
        if($code > 399 && $code < 500){
            $link["status"] = "lost";
        }
        if($code > 499 && $code < 600){
            $link["status"] = "error";
        }
        $checked_links[] = $link["link"];
        return $link;
    }

    function process_links($src){
        global $checked_links;
        $page = load_page($src, true);
        $links = get_links($src, $page["body"]);
        
        if(!empty($links)){
            if(!empty($links["outer"])){
                foreach($links["outer"] as $k => $v){
                    if(!in_array($v["link"], $checked_links))
                        $links["outer"][$k] = check_status($v);
                    }
                }
            }
            if(!empty($links["local"])){
                foreach($links["local"] as $k => $v){
                    if(!in_array($v["link"], $checked_links)){
                        $v = check_status($v);
                        if($v["status"] == "normal"){
                            $v["childs"] = process_links($v["link"]);
                        }
                        $links["local"][$k] = $v;
                    }
                }
            }
        }
        file_put_contents("log/links.log", json_encode($links) . PHP_EOL, FILE_APPEND);
        return $links;
    }

    file_put_contents("log/ajax_handler.log", date("H:i:s d.m.Y", time()) . json_encode($_REQUEST));
    if(!isset($_REQUEST)) die();
    
    $src = urldecode($_REQUEST["src"]);
    $action = urldecode($_REQUEST["action"]);
    $checked_links = array();
    
    file_put_contents("log/ajax_handler.log", PHP_EOL . "action: " . $action . " src: " . $src, FILE_APPEND);
    if(empty($src) || empty($action))  die();

    $result = array();
 
    if($action == "get_page"){
        
        $links = process_links($src);
        if(!empty($links)){
            $result = array(
                "result" => true,
                "data" => $links
            );
        } else {
            $result = array(
                "result" => false
            );
        }
    }

    $result = json_encode($result);
    file_put_contents("log/hrefs.log", $result);
    echo $result;

?>