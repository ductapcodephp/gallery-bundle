<?php

namespace AmzsCMS\GalleryBundle\Routing;

use Symfony\Component\Config\Loader\Loader;
use Symfony\Component\Routing\RouteCollection;

class AmzsGalleryLoader extends Loader
{
    private $isLoaded = false;
    public function load($resource, ?string $type = null): RouteCollection
    {
        if (true === $this->isLoaded) {
            throw new \RuntimeException('Do not add the "amzs_gallery_route_loader" loader twice');
        }
        $type = 'yaml';
        $routes = new RouteCollection();

        /** @var $importedRoutes */
        $importedRoutes = $this->import($resource, $type);
        $routes->addCollection($importedRoutes);
        $routes->addPrefix('/cms/gallery');

        $this->isLoaded = true;

        return $routes;
    }

    public function supports($resource, ?string $type = null): bool
    {
        return 'amzs_gallery_route_loader' == $type;
    }
}