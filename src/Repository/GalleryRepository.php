<?php

namespace AmzsCMS\GalleryBundle\Repository;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use Doctrine\ORM\EntityManagerInterface;
use Gedmo\Tree\Entity\Repository\NestedTreeRepository;

class GalleryRepository extends NestedTreeRepository
{
    public function __construct(EntityManagerInterface $em)
    {
        $classMetadata = $em->getClassMetadata(Gallery::class);
        parent::__construct($em, $classMetadata);
    }
}