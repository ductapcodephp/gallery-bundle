<?php

namespace AmzsCMS\GalleryBundle\Traits;

trait FileTrait
{
    public function getExtension(string $url): string
    {
        $arr = explode('.', $url);
        return end($arr);
    }

    public function getSizeFile(string $url): string
    {
        if (strpos($url, 'http') === 0) {
            $arr = explode('/', $url);
            // Loại bỏ http:, trống (do //), và domain.com
            unset($arr[0], $arr[1], $arr[2]);
            $url = implode('/', $arr);
        }

        $url = $this->getProjectDir() . '/public/' . $url;

        // Kiểm tra file tồn tại trước khi gọi filesize để tránh lỗi Warning
        if (!file_exists($url)) {
            return '0 B';
        }

        return $this->formatFileSize(filesize($url));
    }

    public function formatFileSize($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . $units[$pow];
    }
}