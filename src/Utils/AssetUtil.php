<?php

namespace AmzsCMS\GalleryBundle\Utils;

class AssetUtil
{
    private function __construct()
    {
    }

    public static function getPrefixBundle(): string
    {
        return 'bundles/amzsgallery/';
    }
}