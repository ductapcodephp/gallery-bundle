<?php

namespace AmzsCMS\GalleryBundle\Twig\Extension;

use AmzsCMS\GalleryBundle\Utils\AssetUtil;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class GalleryExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction('get_path_gallery_cms_asset', [AssetUtil::class, 'getPrefixBundle']),
        ];
    }

}
