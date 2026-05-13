<?php
$path = __DIR__ . '/../logica/order.csv';
header('Content-Type: application/json');
function read_pairs($path){
  if(!is_file($path)) return [];
  $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  $out = [];
  foreach($lines as $ln){
    $parts = explode(',', trim($ln), 2);
    if(count($parts)===2){ $out[$parts[0]] = $parts[1]; }
  }
  return $out;
}
function write_pairs($path,$pairs){
  $rows = [];
  foreach($pairs as $k=>$v){ $rows[] = $k . ',' . $v; }
  @file_put_contents($path, implode(PHP_EOL, $rows));
}
if($_SERVER['REQUEST_METHOD']==='GET'){
  $id = (string)($_GET['id'] ?? '');
  $pairs = read_pairs($path);
  $order = isset($pairs[$id]) ? $pairs[$id] : '';
  echo json_encode(['order'=>$order], JSON_UNESCAPED_UNICODE);
  exit;
}
if($_SERVER['REQUEST_METHOD']==='POST'){
  $id = (string)($_POST['id'] ?? '');
  $order = (string)($_POST['order'] ?? '');
  if($id===''){ echo json_encode(['ok'=>false]); exit; }
  $pairs = read_pairs($path);
  $pairs[$id] = $order;
  write_pairs($path,$pairs);
  echo json_encode(['ok'=>true]);
  exit;
}
echo json_encode(['ok'=>false]);
