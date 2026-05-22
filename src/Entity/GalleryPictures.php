<?php

namespace AmzsCMS\GalleryBundle\Entity;


use AmzsCMS\CoreBundle\Traits\Doctrine\Timestampable;
use AmzsCMS\GalleryBundle\Traits\DoctrineIdentifierTrait;
use AmzsCMS\GalleryBundle\Traits\DoctrinePropPictureTrait;
use AmzsCMS\GalleryBundle\Traits\DoctrineTitleSubtitleTrait;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="AmzsCMS\GalleryBundle\Repository\GalleryPicturesRepository")
 * @ORM\Table(name="amzs_gallery_pictures")
 * @ORM\HasLifecycleCallbacks
 */
class GalleryPictures
{
    use DoctrinePropPictureTrait, DoctrineTitleSubtitleTrait, DoctrineIdentifierTrait,Timestampable;

    /**
     * @ORM\ManyToOne(targetEntity="AmzsCMS\GalleryBundle\Entity\Gallery", inversedBy="galleryPicturies")
     * @ORM\JoinColumn(name="gallery_id", referencedColumnName="id", nullable=true)
     */
    private $gallery;

    /**
     * @ORM\ManyToOne(targetEntity="AmzsCMS\GalleryBundle\Entity\Picture", inversedBy="galleryPicturies")
     * @ORM\JoinColumn(name="picture_id", referencedColumnName="id", nullable=true)
     */
    private $picture;

    /**
     * @return mixed
     */
    public function getGallery()
    {
        return $this->gallery;
    }

    /**
     * @param mixed $gallery
     */
    public function setGallery($gallery): void
    {
        $this->gallery = $gallery;
    }

    public function getPicture(): ?Picture
    {
        return $this->picture;
    }

    public function setPicture(?Picture $picture)
    {
        $this->picture = $picture;

        return $this;
    }

}