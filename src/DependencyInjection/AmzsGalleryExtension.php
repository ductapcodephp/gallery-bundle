<?php

namespace AmzsCMS\GalleryBundle\DependencyInjection;


use AmzsCMS\GalleryBundle\Constant\GalleryRoute;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class AmzsGalleryExtension extends Extension implements PrependExtensionInterface
{
    /**
     * @throws \Exception
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $loader = new YamlFileLoader(
            $container,
            new FileLocator(__DIR__.'/../Resources/config')
        );
        $loader->load('services.yaml');

        $container->setParameter('amz.user_bundle.default_password', $config['default_password']);
    }
    public function prepend(ContainerBuilder $container)
    {
        $container->prependExtensionConfig('twig', [
            'globals' => [
                'amzs_admin_gallery_index_route'=> GalleryRoute::INDEX,
                'amzs_admin_gallery_add_route'=> GalleryRoute::ADD,
                'amzs_admin_gallery_edit_route'=> GalleryRoute::EDIT,
                'amzs_admin_gallery_delete_route'=> GalleryRoute::DELETE,

            ],
        ]);
    }
}